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

    // For posts, use targetId; for comments, use postId
    const actualPostId = targetType === 'post' ? targetId : postId;
    if (!actualPostId) {
      console.error('Cannot create notification: missing postId');
      return;
    }

    const postRef = doc(firestore, 'communities', communityId, 'posts', actualPostId);

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
        postId: actualPostId,
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
    <div className="flex items-center gap-1 rounded-full bg-muted/50 backdrop-blur-sm p-1 border border-white/10 shadow-sm transition-all duration-300 hover:bg-muted/80">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full transition-all duration-300 hover:scale-110 active:scale-95",
          userVote === 1
            ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md hover:from-green-600 hover:to-emerald-700 hover:text-white"
            : "hover:bg-green-500/10 hover:text-green-600"
        )}
        onClick={() => handleVote(1)}
        disabled={isVoting}
        aria-label={t('upvote') || "Upvote"}
      >
        <ArrowBigUp className={cn("h-6 w-6 transition-all duration-300", userVote === 1 ? "fill-white scale-110" : "stroke-[1.5px]")} />
      </Button>

      <span className={cn(
        "text-sm font-bold min-w-[24px] text-center tabular-nums transition-colors duration-300",
        userVote === 1 ? "text-green-600" : userVote === -1 ? "text-red-600" : "text-muted-foreground"
      )}>
        {voteCount}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full transition-all duration-300 hover:scale-110 active:scale-95",
          userVote === -1
            ? "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md hover:from-red-600 hover:to-rose-700 hover:text-white"
            : "hover:bg-red-500/10 hover:text-red-600"
        )}
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        aria-label={t('downvote') || "Downvote"}
      >
        <ArrowBigDown className={cn("h-6 w-6 transition-all duration-300", userVote === -1 ? "fill-white scale-110" : "stroke-[1.5px]")} />
      </Button>
    </div>
  );
}
