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
        <Card className="flex glass-card border-none transition-all hover:shadow-lg">
            <div className="flex-1">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div className='flex items-center gap-3'>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={post.creatorPhotoURL} />
                                <AvatarFallback>{getInitials(post.creatorDisplayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardDescription className='text-xs'>
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
                                <CardTitle className='leading-tight text-lg mt-1'>
                                    <Link href={`/community/${post.communityId}/post/${post.id}`} className='hover:underline'>
                                        {post.title}
                                    </Link>
                                </CardTitle>
                            </div>
                        </div>
                        {(isOwner || isModerator) && <PostItemActions communityId={post.communityId} post={post} isOwner={isOwner} isModerator={isModerator} />}
                    </div>
                </CardHeader>
                <CardContent className='pl-16'>
                    <p className="line-clamp-4 whitespace-pre-wrap">{post.content}</p>
                    {post.mediaUrl && (
                        <div className="mt-4 rounded-lg overflow-hidden border bg-black/5">
                            {post.mediaType === 'image' ? (
                                <Image
                                    src={post.mediaUrl}
                                    alt="Post content"
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    className="w-full h-auto max-h-[500px] object-contain"
                                />
                            ) : post.mediaType === 'video' ? (
                                <video src={post.mediaUrl} controls className="w-full h-auto max-h-[500px]" />
                            ) : null}
                        </div>
                    )}
                </CardContent>
                <CardFooter className='flex-col items-start gap-4 pl-16'>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <VoteButtons
                            targetType="post"
                            targetId={post.id}
                            creatorId={post.creatorId}
                            communityId={post.communityId}
                            initialVoteCount={post.voteCount || 0}
                        />
                        <Link href={`/community/${post.communityId}/post/${post.id}`} passHref>
                            <Button variant="ghost" className="rounded-full h-auto p-2 text-sm flex items-center gap-2">
                                <MessageSquare className='h-5 w-5' /> <span>{t('commentsTitle')}</span>
                            </Button>
                        </Link>
                        <ShareButton post={post} />
                    </div>
                    <div className="w-full space-y-3">
                        {isLoadingComments ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            comments.map(comment => {
                                const isCommentOwner = !!(user && user.uid === comment.creatorId);
                                return (
                                    <div key={comment.id} className='text-sm p-2 rounded-md bg-muted/50'>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={comment.creatorPhotoURL} />
                                                    <AvatarFallback className="text-xs">{getInitials(comment.creatorDisplayName)}</AvatarFallback>
                                                </Avatar>
                                                <Link href={`/profile/${comment.creatorId}`} className="font-semibold text-primary hover:underline">{comment.creatorDisplayName}</Link>
                                                <span className="text-xs text-muted-foreground">• {formatDate(comment.createdAt)}</span>
                                            </div>
                                            {(isCommentOwner || isModerator) && (
                                                <CommentItemActions
                                                    communityId={post.communityId}
                                                    postId={post.id}
                                                    comment={comment}
                                                    isOwner={isCommentOwner}
                                                    isModerator={isModerator}
                                                />
                                            )}
                                        </div>
                                        <p className='mt-2 pl-8'>{comment.content}</p>
                                        <div className="pl-8 mt-2">
                                            <VoteButtons
                                                targetType="comment"
                                                targetId={comment.id}
                                                creatorId={comment.creatorId}
                                                communityId={post.communityId}
                                                postId={post.id}
                                                initialVoteCount={comment.voteCount || 0}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
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
                posts.map((post) => (
                    <PostItem key={post.id} post={post} />
                ))
            ) : (
                <p className='text-center text-muted-foreground'>{t('noPostsGlobal')}</p>
            )}
        </div>
    );
}
