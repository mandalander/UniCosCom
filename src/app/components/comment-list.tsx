'use client';

import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/app/components/language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { VoteButtons } from '@/components/vote-buttons';
import { CommentItemActions } from './comment-item-actions';
import Link from 'next/link';
import { useMemo } from 'react';

type Comment = {
  id: string;
  content: string;
  creatorId: string;
  creatorDisplayName: string;
  creatorPhotoURL?: string;
  createdAt: any;
  updatedAt?: any;
  voteCount: number;
};

interface CommentListProps {
    communityId: string;
    postId: string;
}

export function CommentList({ communityId, postId }: CommentListProps) {
  const { t, language } = useLanguage();
  const firestore = useFirestore();
  const { user } = useUser();

  const commentsColRef = useMemo(() => {
    if (!firestore || !communityId || !postId) return null;
    return query(collection(firestore, 'communities', communityId, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  }, [firestore, communityId, postId]);

  const { data: comments, isLoading } = useCollection<Comment>(commentsColRef);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true, locale: language === 'pl' ? pl : enUS });
  };

  const getInitials = (name?: string | null) => {
    return name ? name.charAt(0).toUpperCase() : <User className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
       <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
            <Card key={i}>
                <CardHeader className='flex-row items-center gap-3 space-y-0'>
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
            </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments && comments.length > 0 ? (
        comments.map((comment) => {
            const isOwner = user && user.uid === comment.creatorId;
            return (
              <Card key={comment.id} className="bg-muted/50">
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
                 <CardFooter className="pl-14">
                    <VoteButtons
                        targetType="comment"
                        targetId={comment.id}
                        creatorId={comment.creatorId}
                        communityId={communityId}
                        postId={postId}
                        initialVoteCount={comment.voteCount}
                    />
                </CardFooter>
              </Card>
            )
        })
      ) : (
        <p>{t('noCommentsYet')}</p>
      )}
    </div>
  );
}
