'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, MessageSquare, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useLanguage } from '@/app/components/language-provider';
import { useUser } from '@/firebase';
import { PostItemActions } from './post-item-actions';
import { VoteButtons } from '@/components/vote-buttons';
import { ShareButton } from './share-button';
import { SaveButton } from './save-button';
import { ReactionPicker } from './reaction-picker';
import { ReactionDisplay } from './reaction-display';
import { useReactions } from '@/hooks/use-reactions';
import { useStartConversation } from '@/hooks/use-start-conversation';

import { Post } from '@/lib/types';

export const PostItem = ({ post }: { post: Post }) => {
    const { t, language } = useLanguage();
    const { user } = useUser();

    const { reactionCounts, userReaction, isReacting, toggleReaction } = useReactions({
        targetType: 'post',
        targetId: post.id,
        creatorId: post.creatorId,
        communityId: post.communityId,
        initialReactionCounts: post.reactionCounts || {},
    });

    const { startConversation, isStarting } = useStartConversation();

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

    const handleMessageAuthor = () => {
        startConversation({
            targetUserId: post.creatorId,
            targetUserDisplayName: post.creatorDisplayName,
            targetUserPhotoURL: post.creatorPhotoURL
        });
    };

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
                            <div className="min-w-0 flex-1">
                                <CardDescription className='text-xs flex items-center flex-wrap gap-1'>
                                    <Link href={`/community/${post.communityId}`} className="text-primary hover:underline font-semibold truncate max-w-[150px] sm:max-w-none">{post.communityName || t('community')}</Link>
                                    <span className='mx-0.5'>•</span>
                                    <span className="truncate">
                                        {t('postedByPrefix')}{' '}
                                        <Link href={`/profile/${post.creatorId}`} className="text-primary hover:underline font-semibold">{post.creatorDisplayName}</Link>
                                    </span>
                                    <span className='mx-0.5'>•</span>
                                    <span className="whitespace-nowrap">{formatDate(post.createdAt)}</span>
                                    {post.updatedAt && <span className='text-muted-foreground italic text-xs whitespace-nowrap'> ({t('edited')})</span>}
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
                <CardContent className='px-3 sm:px-4 flex-1'>
                    <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-muted-foreground mb-4">{post.content}</p>
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
                <CardFooter className='flex-col items-start gap-3 px-3 sm:px-4 pb-4 mt-auto border-t pt-4 bg-black/5 dark:bg-white/5'>
                    <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <VoteButtons
                                targetType="post"
                                targetId={post.id}
                                creatorId={post.creatorId}
                                communityId={post.communityId}
                                initialVoteCount={post.voteCount || 0}
                            />
                            <ReactionPicker
                                onReact={toggleReaction}
                                currentReaction={userReaction}
                                disabled={isReacting}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/community/${post.communityId}/post/${post.id}`} passHref>
                                <Button variant="ghost" size="sm" className="rounded-full h-8 px-3 text-xs flex items-center gap-1.5">
                                    <MessageSquare className='h-4 w-4' /> <span className="hidden sm:inline">{t('commentsTitle')}</span>
                                </Button>
                            </Link>
                            <SaveButton postId={post.id} communityId={post.communityId} />
                            <ShareButton post={post} />
                            {user && !isOwner && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full h-8 px-3 text-xs flex items-center gap-1.5"
                                    onClick={handleMessageAuthor}
                                    disabled={isStarting}
                                >
                                    <Mail className='h-4 w-4' />
                                    <span className="hidden sm:inline">{isStarting ? t('messagingUser') : t('messageAuthor')}</span>
                                </Button>
                            )}
                        </div>
                    </div>
                    {reactionCounts && Object.keys(reactionCounts).length > 0 && (
                        <ReactionDisplay
                            reactionCounts={reactionCounts}
                            compact
                            targetType="post"
                            targetId={post.id}
                            communityId={post.communityId}
                        />
                    )}
                </CardFooter>
            </div>
        </Card>
    )
}
