'use client';

import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/lib/types';

// Define a simplified post type for storage to save space
type RecentPostInfo = Pick<Post, 'id' | 'title' | 'communityId' | 'communityName'>;

const RECENTS_KEY = 'recent-posts';
const MAX_RECENTS = 10;

export const useRecentPosts = () => {
    const [recentPosts, setRecentPosts] = useState<RecentPostInfo[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Ensure this only runs on the client
        try {
            const storedRecents = localStorage.getItem(RECENTS_KEY);
            if (storedRecents) {
                setRecentPosts(JSON.parse(storedRecents));
            }
        } catch (error) {
            console.error('Failed to parse recent posts from localStorage:', error);
            setRecentPosts([]);
        }
        setIsLoaded(true);
    }, []);

    const addRecentPost = useCallback((post: Post) => {
        if (!post || !post.id || !post.communityId) return;

        const newPostInfo: RecentPostInfo = {
            id: post.id,
            title: post.title,
            communityId: post.communityId,
            communityName: post.communityName || 'Unknown',
        };

        setRecentPosts(prevPosts => {
            // Remove the post if it already exists to move it to the top
            const filteredPosts = prevPosts.filter(p => p.id !== newPostInfo.id);

            // Add the new post to the beginning of the array
            const updatedPosts = [newPostInfo, ...filteredPosts];

            // Limit the number of recent posts
            const finalPosts = updatedPosts.slice(0, MAX_RECENTS);
            
            try {
                 localStorage.setItem(RECENTS_KEY, JSON.stringify(finalPosts));
            } catch (error) {
                console.error("Failed to save recent posts to localStorage:", error)
            }

            return finalPosts;
        });
    }, []);

    return { recentPosts, addRecentPost, isLoaded };
};
