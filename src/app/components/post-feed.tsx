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

export type Post = {
    id: string;
    title: string;
    content: string;
    creatorId: string;
    creatorDisplayName: string;
    creatorPhotoURL?: string;
    createdAt: any;
    updatedAt?: any;
    communityId: string;
    communityName: string;
    communityCreatorId?: string;
    voteCount: number;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | null;
};

type Comment = {
    id: string;
    content: string;
    creatorId: string;
    creatorDisplayName: string;
    creatorPhotoURL?: string;
    createdAt: any;
    updatedAt?: any;
    voteCount: number;
}

export const PostItem = ({ post }: { post: Post }) => {
    const { t, language } = useLanguage();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const firestore = useFirestore();
    const { user } = useUser();

    useEffect(() => {
        const fetchComments = async () => {
            if (!firestore) return;
            setIsLoadingComments(true);
            const commentsRef = collection(firestore, 'communities', post.communityId, 'posts', post.id, 'comments');
            const q = query(commentsRef, orderBy('createdAt', 'asc'), limit(2));
            const querySnapshot = await getDocs(q);
            const fetchedComments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment))
                .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
            setComments(fetchedComments);
            setIsLoadingComments(false);
        };
        fetchComments();
    }, [firestore, post.communityId, post.id]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return formatDistanceToNow(date, { addSuffix: true, locale: language === 'pl' ? pl : enUS });
    };

    const getInitials = (name?: string | null) => {
        return name ? name.charAt(0).toUpperCase() : <User className="h-5 w-5" />;
    };

    const isOwner = !!(user && user.uid === post.creatorId);
    const isModerator = !!(user && user.uid === post.communityCreatorId);

    return (
        <Card className="flex flex-col h-full glass-card border-none transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
            <div className="flex flex-col h-full">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div className='flex items-center gap-3'>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={post.creatorPhotoURL} />
                                <AvatarFallback>{getInitials(post.creatorDisplayName)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <CardDescription className='text-xs truncate'>
                                    <Link href={`/community/${post.communityId}`} className="text-primary hover:underline font-semibold">{post.communityName}</Link>
                                    <span className='mx-1'>•</span>
                                    <span>
                                        {t('postedByPrefix')}{' '}
                                        <Link href={`/profile/${post.creatorId}`} className="text-primary hover:underline font-semibold">{post.creatorDisplayName}</Link>
                                    </span>
                                    <span className='mx-1'>•</span>
                                    <span>{formatDate(post.createdAt)}</span>
                                    {post.updatedAt && <span className='text-muted-foreground italic text-xs'> ({t('edited')})</span>}
                                </CardDescription>
                                <CardTitle className='leading-tight text-lg mt-1 line-clamp-2'>
                                    <Link href={`/community/${post.communityId}/post/${post.id}`} className='hover:underline'>
                                        {post.title}
                                    </Link>
                                </CardTitle>
                            </div>
                        </div>
                        {(isOwner || isModerator) && <PostItemActions communityId={post.communityId} post={post} isOwner={isOwner} isModerator={isModerator} />}
                    </div>
                </CardHeader>
                <CardContent className='pl-4 pr-4 flex-1'>
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground mb-4">{post.content}</p>
                    {post.mediaUrl && (
                        <div className="rounded-lg overflow-hidden border bg-black/5 aspect-video relative">
                            {post.mediaType === 'image' ? (
                                <Image
                                    src={post.mediaUrl}
                                    alt="Post content"
                                    fill
                                    className="object-cover transition-transform duration-500 hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            ) : post.mediaType === 'video' ? (
                                <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                            ) : null}
                        </div>
                    )}
                </CardContent>
                <CardFooter className='flex-col items-start gap-4 pl-4 pr-4 pb-4 mt-auto border-t pt-4 bg-black/5 dark:bg-white/5'>
                    <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                        <VoteButtons
                            targetType="post"
                            targetId={post.id}
                            creatorId={post.creatorId}
                            communityId={post.communityId}
                            initialVoteCount={post.voteCount || 0}
                        />
                        <div className="flex items-center gap-2">
                            <Link href={`/community/${post.communityId}/post/${post.id}`} passHref>
                                <Button variant="ghost" size="sm" className="rounded-full h-8 px-3 text-xs flex items-center gap-1.5">
                                    <MessageSquare className='h-4 w-4' /> <span>{t('commentsTitle')}</span>
                                </Button>
                            </Link>
                            <ShareButton post={post} />
                        </div>
                    </div>
                </CardFooter>
            </div>
        </Card>
    )
}


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
