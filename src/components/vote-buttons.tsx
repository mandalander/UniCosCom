'use client';

import { useState, useEffect } from 'react';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, Transaction, collection, serverTimestamp, getDocFromServer, runTransaction, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/components/language-provider';
import { cn } from '@/lib/utils';
import { FirestorePermissionError } from '@/firebase/errors';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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

  useEffect(() => {
    const fetchUserVote = async () => {
      if (!user || !firestore) return;
      let voteRef;
      if (targetType === 'post') {
        voteRef = doc(firestore, 'communities', communityId, 'posts', targetId, 'votes', user.uid);
      } else if (postId) {
        voteRef = doc(firestore, 'communities', communityId, 'posts', postId, 'comments', targetId, 'votes', user.uid);
      }

      if (voteRef) {
        try {
            const voteSnap = await getDoc(voteRef);
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
      }
    };
    fetchUserVote();
  }, [user, firestore, communityId, postId, targetId, targetType]);

   const createNotification = (targetAuthorId: string) => {
    if (!user || !firestore || user.uid === targetAuthorId) {
      return Promise.resolve();
    }

    const postRef = doc(firestore, 'communities', communityId, postId || targetId);
    
    // This is a best-effort attempt to get the post title. It might fail if rules
    // don't allow it, so we have a fallback.
    return getDocFromServer(postRef).then(postSnap => {
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
        // The wrapper will handle permission errors here
        return addDocumentNonBlocking(notificationsRef, notificationData);
    }).catch(e => {
        // If getting the post fails, we still try to create the notification.
        // The wrapper for addDocumentNonBlocking will handle the actual permission error.
        const notificationsRef = collection(firestore, 'userProfiles', targetAuthorId, 'notifications');
        const notificationData = {
            recipientId: targetAuthorId,
            type: 'vote',
            targetType: targetType,
            targetId: targetId,
            targetTitle: 'a post', // Fallback title
            communityId: communityId,
            postId: postId || targetId,
            actorId: user.uid,
            actorDisplayName: user.displayName || 'Someone',
            read: false,
            createdAt: serverTimestamp(),
        };
        return addDocumentNonBlocking(notificationsRef, notificationData);
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
    if (!firestore || isVoting) return;

    setIsVoting(true);

    const voteValueBefore = userVote || 0;
    const newVoteValue = userVote === newVote ? 0 : newVote;
    const voteChange = newVoteValue - voteValueBefore;

    // Optimistic UI update
    setVoteCount(prev => (prev || 0) + voteChange);
    setUserVote(newVoteValue === 0 ? null : newVoteValue);

    let targetRef, voteRef;

    if (targetType === 'post') {
        targetRef = doc(firestore, 'communities', communityId, 'posts', targetId);
        voteRef = doc(firestore, 'communities', communityId, 'posts', targetId, 'votes', user.uid);
    } else if (postId) {
        targetRef = doc(firestore, 'communities', communityId, 'posts', postId, 'comments', targetId);
        voteRef = doc(firestore, 'communities', communityId, 'posts', postId, 'comments', targetId, 'votes', user.uid);
    } else {
        setIsVoting(false);
        return;
    }
    
    try {
      await runTransaction(firestore, async (transaction: Transaction) => {
          const voteDoc = await transaction.get(voteRef);
          const currentVoteOnDb = voteDoc.exists() ? voteDoc.data().value : 0;
          const voteDifference = newVoteValue - currentVoteOnDb;
          
          transaction.update(targetRef, { voteCount: increment(voteDifference) });
          
          if (newVoteValue === 0) {
              transaction.delete(voteRef);
          } else {
              transaction.set(voteRef, { value: newVoteValue, userId: user.uid });
          }
      });
      
      if(newVoteValue === 1) {
         await createNotification(creatorId);
      }

    } catch (e: any) {
      // Revert optimistic UI update on error.
      setVoteCount(prev => (prev || 0) - voteChange);
      setUserVote(voteValueBefore === 0 ? null : voteValueBefore);
      
      const permissionError = new FirestorePermissionError({
        path: voteRef.path,
        operation: 'write', // Use a general 'write' operation for simplicity in transactions
        requestResourceData: newVoteValue === 0 ? undefined : { value: newVoteValue, userId: user.uid }
      });
      
      // Throw the error directly to be caught by Next.js error boundary
      throw permissionError;

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
            "h-7 w-7 rounded-full", 
            userVote === 1 && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
        )}
        onClick={() => handleVote(1)}
        disabled={isVoting}
      >
        <ArrowBigUp className={cn("h-5 w-5", userVote === 1 && "fill-current")} />
      </Button>
      <span className="text-sm font-bold min-w-[24px] text-center tabular-nums">{voteCount}</span>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
            "h-7 w-7 rounded-full", 
            userVote === -1 && "bg-blue-600 text-white hover:bg-blue-600/90 hover:text-white"
        )}
        onClick={() => handleVote(-1)}
        disabled={isVoting}
      >
        <ArrowBigDown className={cn("h-5 w-5", userVote === -1 && "fill-current")} />
      </Button>
    </div>
  );
}
