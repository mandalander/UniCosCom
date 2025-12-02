'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useLanguage } from '@/app/components/language-provider';
import { useUser } from '@/firebase';
import { VoteButtons } from '@/components/vote-buttons';
import { CommentItemActions } from './comment-item-actions';
import { CreateCommentForm } from './create-comment-form';

import { Comment } from '@/lib/types';

interface CommentThreadProps {
    comment: Comment;
    // replies: Comment[]; // Removed redundant prop
    allComments: Comment[];
    communityId: string;
    postId: string;
    postAuthorId: string;
    postTitle: string;
    depth?: number;
}

export function CommentThread({
    comment,
    // replies, // Removed
    allComments,
    communityId,
    postId,
    postAuthorId,
    postTitle,
    depth = 0
}: CommentThreadProps) {
    const { t, language } = useLanguage();
    const { user } = useUser();
    const [isReplying, setIsReplying] = useState(false);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return formatDistanceToNow(date, { addSuffix: true, locale: language === 'pl' ? pl : enUS });
    };

    const getInitials = (name?: string | null) => {
        return name ? name.charAt(0).toUpperCase() : <User className="h-5 w-5" />;
    };

    const isOwner = user && user.uid === comment.creatorId;

    // Find replies to this comment
    const childReplies = allComments.filter(c => c.parentId === comment.id);

    return (
        <div className={`space-y-4 ${depth > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
            <Card className="bg-muted/50">
                <CardHeader className='flex-row items-center justify-between gap-3 space-y-0 pb-2'>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.creatorPhotoURL} />
                            <AvatarFallback>{getInitials(comment.creatorDisplayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm">
                                <Link href={`/profile/${comment.creatorId}`} className="font-semibold text-primary hover:underline">{comment.creatorDisplayName}</Link>
                                <span className="text-xs text-muted-foreground ml-2">
                                    • {formatDate(comment.createdAt)}
                                    {comment.updatedAt && <span className='italic'> ({t('edited')})</span>}
                                </span>
                            </p>
                        </div>
                    </div>
                    {isOwner && (
                        <CommentItemActions
                            communityId={communityId}
                            postId={postId}
                            comment={comment}
                        />
                    )}
                </CardHeader>
                <CardContent className="pl-14">
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </CardContent>
                <CardFooter className="pl-14 py-2">
                    <div className="flex items-center gap-4">
                        <VoteButtons
                            targetType="comment"
                            targetId={comment.id}
                            creatorId={comment.creatorId}
                            communityId={communityId}
                            postId={postId}
                            initialVoteCount={comment.voteCount}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-muted-foreground hover:text-primary"
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {t('reply') || "Reply"}
                        </Button>
                    </div>
                </CardFooter>

                {isReplying && (
                    <div className="px-4 pb-4 pl-14">
                        <CreateCommentForm
                            communityId={communityId}
                            postId={postId}
                            postAuthorId={postAuthorId || ''} // Fallback if missing
                            postTitle={postTitle || ''} // Fallback
                            parentId={comment.id}
                            onCancel={() => setIsReplying(false)}
                        />
                    </div>
                )}
            </Card>

            {/* Render child replies recursively */}
            {childReplies.map(reply => (
                <CommentThread
                    key={reply.id}
                    comment={reply}
                    // replies={childReplies} // Removed
                    allComments={allComments}
                    communityId={communityId}
                    postId={postId}
                    postAuthorId={postAuthorId}
                    postTitle={postTitle}
                    depth={depth + 1}
                />
            ))}
        </div>
    );
}
