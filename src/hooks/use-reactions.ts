'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, runTransaction, increment, collection, addDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { ReactionType, ReactionCounts } from '@/lib/reactions';

interface UseReactionsProps {
    targetType: 'post' | 'comment';
    targetId: string;
    creatorId: string;
    communityId: string;
    postId?: string;
    initialReactionCounts?: ReactionCounts;
}

export function useReactions({
    targetType,
    targetId,
    creatorId,
    communityId,
    postId,
    initialReactionCounts = {},
}: UseReactionsProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [reactionCounts, setReactionCounts] = useState<ReactionCounts>(initialReactionCounts);
    const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
    const [isReacting, setIsReacting] = useState(false);


    // Fetch user's current reaction
    useEffect(() => {
        const fetchUserReaction = async () => {
            if (!user || !firestore) {
                setUserReaction(null);
                return;
            }

            try {
                let reactionDocRef;
                if (targetType === 'post') {
                    reactionDocRef = doc(firestore, 'communities', communityId, 'posts', targetId, 'reactions', user.uid);
                } else if (postId) {
                    reactionDocRef = doc(firestore, 'communities', communityId, 'posts', postId, 'comments', targetId, 'reactions', user.uid);
                } else {
                    return;
                }

                const reactionSnap = await getDoc(reactionDocRef);
                if (reactionSnap.exists()) {
                    setUserReaction(reactionSnap.data().type as ReactionType);
                } else {
                    setUserReaction(null);
                }
            } catch (error) {
                console.error('Error fetching user reaction:', error);
                setUserReaction(null);
            }
        };

        fetchUserReaction();
    }, [user, firestore, targetType, communityId, targetId, postId]);

    const createNotification = async (reactionType: ReactionType) => {
        if (!user || !firestore || user.uid === creatorId) {
            return;
        }

        const actualPostId = targetType === 'post' ? targetId : postId;
        if (!actualPostId) {
            console.error('Cannot create notification: missing postId');
            return;
        }

        try {
            const postRef = doc(firestore, 'communities', communityId, 'posts', actualPostId);
            const postSnap = await getDocFromServer(postRef);
            const postTitle = postSnap.exists() ? postSnap.data().title : 'a post';

            const notificationsRef = collection(firestore, 'userProfiles', creatorId, 'notifications');
            await addDoc(notificationsRef, {
                recipientId: creatorId,
                type: 'reaction',
                targetType: targetType,
                targetId: targetId,
                targetTitle: postTitle,
                reactionType: reactionType,
                communityId: communityId,
                postId: actualPostId,
                actorId: user.uid,
                actorDisplayName: user.displayName || 'Someone',
                read: false,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    };

    const toggleReaction = async (reactionType: ReactionType) => {
        if (!user) {
            toast({
                variant: 'destructive',
                description: 'You must be logged in to react',
            });
            router.push('/login');
            return;
        }

        if (!firestore || isReacting) return;

        setIsReacting(true);

        const previousReaction = userReaction;
        const newReaction = userReaction === reactionType ? null : reactionType;

        // Optimistic update
        setUserReaction(newReaction);
        setReactionCounts(prev => {
            const updated = { ...prev };

            // Remove old reaction
            if (previousReaction && updated[previousReaction]) {
                updated[previousReaction] = Math.max(0, (updated[previousReaction] || 0) - 1);
            }

            // Add new reaction
            if (newReaction) {
                updated[newReaction] = (updated[newReaction] || 0) + 1;
            }

            return updated;
        });

        try {
            let targetRef, reactionDocRef;

            if (targetType === 'post') {
                targetRef = doc(firestore, 'communities', communityId, 'posts', targetId);
                reactionDocRef = doc(firestore, 'communities', communityId, 'posts', targetId, 'reactions', user.uid);
            } else if (postId) {
                targetRef = doc(firestore, 'communities', communityId, 'posts', postId, 'comments', targetId);
                reactionDocRef = doc(firestore, 'communities', communityId, 'posts', postId, 'comments', targetId, 'reactions', user.uid);
            } else {
                throw new Error('Missing postId for comment reaction');
            }

            await runTransaction(firestore, async (transaction) => {
                const reactionDoc = await transaction.get(reactionDocRef);
                const currentReaction = reactionDoc.exists() ? reactionDoc.data().type as ReactionType : null;

                const updates: any = {};

                // Remove old reaction count
                if (currentReaction) {
                    updates[`reactionCounts.${currentReaction}`] = increment(-1);
                }

                // Add new reaction count
                if (newReaction) {
                    updates[`reactionCounts.${newReaction}`] = increment(1);
                    transaction.set(reactionDocRef, {
                        type: newReaction,
                        userId: user.uid,
                        createdAt: serverTimestamp(),
                    });
                } else {
                    transaction.delete(reactionDocRef);
                }

                if (Object.keys(updates).length > 0) {
                    transaction.update(targetRef, updates);
                }
            });

            // Create notification for new reaction
            if (newReaction && creatorId !== user.uid) {
                await createNotification(newReaction);
            }
        } catch (error) {
            console.error('Error toggling reaction:', error);

            // Revert optimistic update
            setUserReaction(previousReaction);
            setReactionCounts(prev => {
                const reverted = { ...prev };

                // Revert new reaction
                if (newReaction && reverted[newReaction]) {
                    reverted[newReaction] = Math.max(0, (reverted[newReaction] || 0) - 1);
                }

                // Restore old reaction
                if (previousReaction) {
                    reverted[previousReaction] = (reverted[previousReaction] || 0) + 1;
                }

                return reverted;
            });

            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to react. Please try again.',
            });
        } finally {
            setIsReacting(false);
        }
    };

    return {
        reactionCounts,
        userReaction,
        isReacting,
        toggleReaction,
    };
}
