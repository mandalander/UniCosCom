'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { ReactionType } from '@/lib/reactions';

export interface ReactionUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  reactionType: ReactionType;
  createdAt?: Date;
}

interface UseReactionUsersProps {
  targetType: 'post' | 'comment';
  targetId: string;
  communityId: string;
  postId?: string;
  enabled?: boolean;
}

export function useReactionUsers({
  targetType,
  targetId,
  communityId,
  postId,
  enabled = true,
}: UseReactionUsersProps) {
  const firestore = useFirestore();
  const [users, setUsers] = useState<ReactionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !firestore) {
      setUsers([]);
      return;
    }

    const fetchReactionUsers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let reactionsPath: string;
        
        if (targetType === 'post') {
          reactionsPath = `communities/${communityId}/posts/${targetId}/reactions`;
        } else if (postId) {
          reactionsPath = `communities/${communityId}/posts/${postId}/comments/${targetId}/reactions`;
        } else {
          throw new Error('Missing postId for comment reactions');
        }

        const reactionsRef = collection(firestore, reactionsPath);
        const reactionsSnap = await getDocs(reactionsRef);

        if (reactionsSnap.empty) {
          setUsers([]);
          setIsLoading(false);
          return;
        }

        // Fetch user profiles for all reactors
        const userPromises = reactionsSnap.docs.map(async (reactionDoc) => {
          const userId = reactionDoc.id;
          const reactionData = reactionDoc.data();
          
          try {
            const userProfileRef = doc(firestore, 'userProfiles', userId);
            const userProfileSnap = await getDoc(userProfileRef);
            
            const userData = userProfileSnap.exists() ? userProfileSnap.data() : {};
            
            return {
              userId,
              displayName: userData.displayName || 'Unknown User',
              avatarUrl: userData.avatarUrl,
              reactionType: reactionData.type as ReactionType,
              createdAt: reactionData.createdAt?.toDate(),
            } as ReactionUser;
          } catch (err) {
            console.error(`Error fetching user ${userId}:`, err);
            return {
              userId,
              displayName: 'Unknown User',
              reactionType: reactionData.type as ReactionType,
              createdAt: reactionData.createdAt?.toDate(),
            } as ReactionUser;
          }
        });

        const fetchedUsers = await Promise.all(userPromises);
        
        // Sort by most recent first
        fetchedUsers.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });

        setUsers(fetchedUsers);
      } catch (err) {
        console.error('Error fetching reaction users:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch reaction users'));
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReactionUsers();
  }, [enabled, firestore, targetType, targetId, communityId, postId]);

  // Group users by reaction type
  const usersByReaction = users.reduce((acc, user) => {
    if (!acc[user.reactionType]) {
      acc[user.reactionType] = [];
    }
    acc[user.reactionType].push(user);
    return acc;
  }, {} as Record<ReactionType, ReactionUser[]>);

  return {
    users,
    usersByReaction,
    isLoading,
    error,
  };
}
