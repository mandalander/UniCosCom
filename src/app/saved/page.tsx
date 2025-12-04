'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PostItem } from '../components/post-item';
import { Post } from '@/lib/types';
import { useLanguage } from '../components/language-provider';
import { Loader2, Bookmark } from 'lucide-react';

export default function SavedPostsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { t } = useLanguage();
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !firestore) {
            setLoading(false);
            return;
        }

        const fetchSavedPosts = async () => {
            try {
                const userProfileRef = doc(firestore, 'userProfiles', user.uid);
                const userProfileSnap = await getDoc(userProfileRef);

                if (!userProfileSnap.exists()) {
                    setLoading(false);
                    return;
                }

                const savedPostIds = userProfileSnap.data().savedPosts || [];

                if (savedPostIds.length === 0) {
                    setSavedPosts([]);
                    setLoading(false);
                    return;
                }

                // Fetch each saved post
                const postsData = await Promise.all(
                    savedPostIds.map(async (fullPostId: string) => {
                        const [communityId, postId] = fullPostId.split('/');
                        const postRef = doc(firestore, 'communities', communityId, 'posts', postId);
                        const postSnap = await getDoc(postRef);

                        if (!postSnap.exists()) return null;

                        const communityRef = doc(firestore, 'communities', communityId);
                        const communitySnap = await getDoc(communityRef);
                        const communityName = communitySnap.exists() ? communitySnap.data().name : 'Unknown';
                        const communityCreatorId = communitySnap.exists() ? communitySnap.data().creatorId : null;

                        return {
                            id: postSnap.id,
                            ...postSnap.data(),
                            communityId,
                            communityName,
                            communityCreatorId,
                        } as Post;
                    })
                );

                setSavedPosts(postsData.filter(Boolean) as Post[]);
            } catch (error) {
                console.error('Error fetching saved posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSavedPosts();
    }, [user, firestore]);

    if (!user) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">{t('loginRequired') || 'Please log in to view saved posts.'}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-8 py-8 px-4">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Bookmark className="h-8 w-8" />
                    {t('savedPosts') || 'Saved Posts'}
                </h1>
                <p className="text-muted-foreground">
                    {t('savedPostsDescription') || 'Posts you\'ve bookmarked for later'}
                </p>
            </div>

            {savedPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>{t('noSavedPosts') || 'No saved posts yet.'}</p>
                    <p className="text-sm mt-2">{t('noSavedPostsHint') || 'Click the bookmark icon on posts to save them here.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedPosts.map((post) => (
                        <PostItem key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}
