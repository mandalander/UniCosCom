'use client';

import { useState, useEffect } from 'react';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, Transaction, collection, serverTimestamp, getDocFromServer, runTransaction, increment, addDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/components/language-provider';
import { cn } from '@/lib/utils';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface VoteButtonsProps {
  targetType: 'post' | 'comment';
  targetId: string;
  creatorId: string;
  communityId: string;
  postId?: string; // only for comments
  initialVoteCount: number;
}

export function VoteButtons({ targetType, targetId, creatorId, communityId, postId, initialVoteCount }: VoteButtonsProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  const [voteCount, setVoteCount] = useState(initialVoteCount || 0);
  const [userVote, setUserVote] = useState<number | null>(null); // 1 for up, -1 for down, null for none
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    setVoteCount(initialVoteCount || 0);
  }, [initialVoteCount]);

  const voteDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    if (targetType === 'post') {
      return doc(firestore, 'communities', communityId, 'posts', targetId, 'votes', user.uid);
    } else if (postId) {
      return doc(firestore, 'communities', communityId, 'posts', postId, 'comments', targetId, 'votes', user.uid);
    }
    return null;
  }, [user, firestore, targetType, communityId, targetId, postId]);


  useEffect(() => {
    const fetchUserVote = async () => {
      if (voteDocRef) {
        try {
          const voteSnap = await getDoc(voteDocRef);
          if (voteSnap.exists()) {
            setUserVote(voteSnap.data().value);
          } else {
            setUserVote(null);
          }
        } catch (e) {
          // This might fail due to security rules on read, which is fine.
          // We'll proceed assuming no vote.
          setUserVote(null);
        }
      } else if (!user) {
        setUserVote(null);
      }
    };
    fetchUserVote();
  }, [voteDocRef, user]);

  const createNotification = (targetAuthorId: string) => {
    if (!user || !firestore || user.uid === targetAuthorId) {
      return;
    }

    const postRef = doc(firestore, 'communities', communityId, postId || targetId);

    getDocFromServer(postRef).then(postSnap => {
      const postTitle = postSnap.exists() ? postSnap.data().title : 'a post';
      const notificationsRef = collection(firestore, 'userProfiles', targetAuthorId, 'notifications');
      const notificationData = {
        recipientId: targetAuthorId,
        type: 'vote',
        targetType: targetType,
        targetId: targetId,
        targetTitle: postTitle,
        communityId: communityId,
        postId: postId || targetId,
        actorId: user.uid,
        actorDisplayName: user.displayName || 'Someone',
        read: false,
        createdAt: serverTimestamp(),
      };
      addDoc(notificationsRef, notificationData).catch(e => {
        // Non-critical, so just log the error if notification fails
        console.error("Error creating notification: ", e);
      });
    }).catch(e => {
      console.error("Error fetching post for notification: ", e);
    });
  }

  const handleVote = async (newVote: 1 | -1) => {
    if (!user) {
      toast({
        variant: 'destructive',
        description: t('mustBeLoggedInToVote'),
      });
      router.push('/login');
      return;
    }
    if (!firestore || isVoting || !voteDocRef) return;

    setIsVoting(true);

    const voteValueBefore = userVote || 0;
    const newVoteValue = userVote === newVote ? 0 : newVote; // If clicking the same button again, it's a "take back"
    const voteChange = newVoteValue - voteValueBefore;

    // Optimistic UI update
    setVoteCount(prev => (prev || 0) + voteChange);
    setUserVote(newVoteValue === 0 ? null : newVoteValue);

    let targetRef;
    if (targetType === 'post') {
      targetRef = doc(firestore, 'communities', communityId, 'posts', targetId);
    } else if (postId) {
      targetRef = doc(firestore, 'communities', communityId, 'posts', postId, 'comments', targetId);
    } else {
      setIsVoting(false);
      return;
    }

    try {
      await runTransaction(firestore, async (transaction: Transaction) => {
        const voteDoc = await transaction.get(voteDocRef);
        const currentVoteOnDb = voteDoc.exists() ? voteDoc.data().value : 0;
        const voteDifference = newVoteValue - currentVoteOnDb;

        transaction.update(targetRef, { voteCount: increment(voteDifference) });

        if (newVoteValue === 0) {
          transaction.delete(voteDocRef);
        } else {
          transaction.set(voteDocRef, { value: newVoteValue, userId: user.uid });
        }
      });

      if (newVoteValue === 1 && creatorId !== user.uid) {
        createNotification(creatorId);
      }

    } catch (e: any) {
        // Revert optimistic UI update on error.
        setVoteCount(prev => (prev || 0) - voteChange);
        setUserVote(voteValueBefore === 0 ? null : voteValueBefore);
        
        const isDeleteOperation = newVoteValue === 0;
        const operationType = isDeleteOperation ? 'delete' : 'write';
        
        const permissionError = new FirestorePermissionError({
            path: voteDocRef.path,
            operation: operationType,
            requestResourceData: isDeleteOperation ? undefined : { value: newVoteValue, userId: user.uid },
        } satisfies SecurityRuleContext);

        // Emit the contextual error for the global listener to catch and throw.
        errorEmitter.emit('permission-error', permissionError);

    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-full bg-muted p-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 rounded-full transition-transform duration-200 hover:scale-110 active:scale-95",
          userVote === 1 && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
        )}
        onClick={() => handleVote(1)}
        disabled={isVoting}
        aria-label={t('upvote') || "Upvote"}
      >
        <ArrowBigUp className={cn("h-5 w-5 transition-colors", userVote === 1 && "fill-current")} />
      </Button>
      <span className="text-sm font-bold min-w-[24px] text-center tabular-nums">{voteCount}</span>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 rounded-full transition-transform duration-200 hover:scale-110 active:scale-95",
          userVote === -1 && "bg-blue-600 text-white hover:bg-blue-600/90 hover:text-white"
        )}
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        aria-label={t('downvote') || "Downvote"}
      >
        <ArrowBigDown className={cn("h-5 w-5 transition-colors", userVote === -1 && "fill-current")} />
      </Button>
    </div>
  );
}
