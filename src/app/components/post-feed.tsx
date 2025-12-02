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
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                communityId: doc.ref.parent.parent?.id
            })) as Post[];

            // Extract unique community IDs
            const communityIds = Array.from(new Set(postsData.map(p => p.communityId).filter(Boolean)));

            // Fetch communities in parallel (or use a cache if we had one, but simple batching here is better than N+1)
            // Note: Firestore 'in' query is limited to 10, so we might need to chunk or just fetch individually but in parallel.
            // For now, let's fetch individually but in parallel which is better than serial await in map.
            // Actually, we can just fetch all unique communities.

            const communityPromises = communityIds.map(async (id) => {
                if (!id) return null;
                const docRef = doc(firestore, 'communities', id);
                const snap = await getDoc(docRef);
                return { id, ...snap.data() } as { id: string, name: string, creatorId: string };
            });

            const communities = (await Promise.all(communityPromises)).filter(Boolean);
            const communityMap = new Map(communities.map(c => [c!.id, c]));

            const enrichedPosts = postsData.map(post => {
                const community = communityMap.get(post.communityId);
                return {
                    ...post,
                    communityName: community?.name || 'Unknown Community',
                    communityCreatorId: community?.creatorId
                };
            }).filter(p => p.createdAt); // Filter out potential incomplete writes

            if (sortBy === 'latest') {
                enrichedPosts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            } else if (sortBy === 'top') {
                enrichedPosts.sort((a, b) => b.voteCount - a.voteCount);
            } else {
                enrichedPosts.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
            }

            setPosts(enrichedPosts);
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
