'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collectionGroup, query, getDocs, collection, limit, doc, getDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/app/components/language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { PostItemActions } from './post-item-actions';
import { VoteButtons } from '@/components/vote-buttons';
import { CommentItemActions } from './comment-item-actions';
import { ShareButton } from './share-button';

import { PostItem, Post } from './post-item';


import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ... (previous imports)

export function PostFeed() {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'latest' | 'top' | 'oldest'>('latest');

    useEffect(() => {
        if (!firestore) return;
        setIsLoading(true);

        let q;
        const postsRef = collectionGroup(firestore, 'posts');

        if (sortBy === 'latest') {
            q = query(postsRef, orderBy('createdAt', 'desc'), limit(25));
        } else if (sortBy === 'top') {
            q = query(postsRef, orderBy('voteCount', 'desc'), limit(25));
        } else {
            q = query(postsRef, orderBy('createdAt', 'asc'), limit(25));
        }

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const postsDataPromises = snapshot.docs.map(async (postDoc) => {
                const post = { id: postDoc.id, ...postDoc.data() } as Omit<Post, 'communityName' | 'communityId'>;
                const communityRef = postDoc.ref.parent.parent;

                if (!communityRef) return null;

                const communitySnap = await getDoc(communityRef);
                const communityData = communitySnap.exists() ? communitySnap.data() : null;
                const communityName = communityData ? communityData.name : 'Unknown Community';
                const communityCreatorId = communityData ? communityData.creatorId : null;

                return {
                    ...post,
                    communityId: communityRef.id,
                    communityName: communityName,
                    communityCreatorId: communityCreatorId,
                } as Post;
            });

            const postsData = (await Promise.all(postsDataPromises))
                .filter((p): p is Post => p !== null && p.createdAt);

            // Client-side sort as a fallback/refinement since Promise.all order isn't guaranteed to match snapshot order strictly if async ops vary, 
            // though usually map preserves order. But explicit sort is safer.
            if (sortBy === 'latest') {
                postsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            } else if (sortBy === 'top') {
                postsData.sort((a, b) => b.voteCount - a.voteCount);
            } else {
                postsData.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
            }

            setPosts(postsData);
            setIsLoading(false);
        }, (error: any) => {
            console.error("Error fetching posts:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, sortBy]);


    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-end mb-4">
                    <Skeleton className="h-10 w-64" />
                </div>
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className='pl-16'>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full mt-2" />
                            <Skeleton className="h-4 w-3/4 mt-2" />
                        </CardContent>
                        <CardFooter className='pl-16'>
                            <Skeleton className="h-8 w-40" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">{t('latestPosts')}</h2>
                <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'latest' | 'top' | 'oldest')} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-3 glass">
                        <TabsTrigger value="latest">{t('sortLatest') || "Latest"}</TabsTrigger>
                        <TabsTrigger value="top">{t('sortTop') || "Top"}</TabsTrigger>
                        <TabsTrigger value="oldest">{t('sortOldest') || "Oldest"}</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {posts && posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <PostItem key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <p className='text-center text-muted-foreground'>{t('noPostsGlobal')}</p>
            )}
        </div>
    );
}
