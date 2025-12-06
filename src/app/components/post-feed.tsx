'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collectionGroup, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/app/components/language-provider';
import React, { useState, useMemo } from 'react';
import { AdBanner } from './ad-banner';
import { PostItem } from './post-item';
import { Post } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


export function PostFeed() {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const [sortBy, setSortBy] = useState<'latest' | 'top' | 'oldest'>('latest');

    const postsQuery = useMemo(() => {
        if (!firestore) return null;

        const postsRef = collectionGroup(firestore, 'posts');
        if (sortBy === 'top') {
            return query(postsRef, orderBy('voteCount', 'desc'), limit(25));
        }
        if (sortBy === 'oldest') {
            return query(postsRef, orderBy('createdAt', 'asc'), limit(25));
        }
        // Default to 'latest'
        return query(postsRef, orderBy('createdAt', 'desc'), limit(25));

    }, [firestore, sortBy]);

    const { data: posts, isLoading, error } = useCollection<Post>(postsQuery);

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

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                <h3 className="font-bold mb-2">Error loading posts</h3>
                <p>{error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
                <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'latest' | 'top' | 'oldest')} className="w-auto">
                    <TabsList className="glass">
                        <TabsTrigger value="latest">{t('sortLatest') || "Latest"}</TabsTrigger>
                        <TabsTrigger value="top">{t('sortTop') || "Top"}</TabsTrigger>
                        <TabsTrigger value="oldest">{t('sortOldest') || "Oldest"}</TabsTrigger>
                    </TabsList>
                </Tabs>
                <h2 className="text-2xl font-bold tracking-tight">{t('latestPosts')}</h2>
            </div>

            {posts && posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post, index) => (
                        <React.Fragment key={post.id}>
                            <PostItem post={post} />
                            {(index + 1) % 5 === 0 && (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                    <AdBanner
                                        dataAdSlot="1234567890"
                                        dataAdFormat="fluid"
                                        dataFullWidthResponsive={true}
                                        className="my-6"
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            ) : (
                <p className='text-center text-muted-foreground'>{t('noPostsGlobal')}</p>
            )}
        </div>
    );
}
