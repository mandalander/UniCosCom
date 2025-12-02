'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from './language-provider';
import { CommentThread } from './comment-thread';
import { Comment } from '@/lib/types';

interface CommentListProps {
  communityId: string;
  postId: string;
  postAuthorId?: string;
  postTitle?: string;
}

export function CommentList({ communityId, postId, postAuthorId, postTitle }: CommentListProps) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { user } = useUser();

  const commentsColRef = useMemo(() => {
    if (!firestore || !communityId || !postId) return null;
    return query(collection(firestore, 'communities', communityId, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  }, [firestore, communityId, postId]);

  const { data: comments, isLoading } = useCollection<Comment>(commentsColRef);

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

  // Filter for root comments (no parentId)
  const rootComments = comments ? comments.filter(c => !c.parentId) : [];

  return (
    <div className="space-y-4">
      {rootComments && rootComments.length > 0 ? (
        rootComments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            // replies={[]} // Removed
            allComments={comments || []}
            communityId={communityId}
            postId={postId}
            postAuthorId={postAuthorId || ''}
            postTitle={postTitle || ''}
          />
        ))
      ) : (
        <p>{t('noCommentsYet')}</p>
      )}
    </div>
  );
}
