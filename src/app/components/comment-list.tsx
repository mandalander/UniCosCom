'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from './language-provider';
import { CommentThread } from './comment-thread';
import { Comment } from '@/lib/types';

interface CommentListProps {
  communityId: string;
  postId: string;
  postAuthorId?: string;
  postTitle?: string;
}

type SortOption = 'best' | 'newest' | 'oldest';

export function CommentList({ communityId, postId, postAuthorId, postTitle }: CommentListProps) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { user } = useUser();
  const [sortBy, setSortBy] = useState<SortOption>('best');

  const commentsColRef = useMemo(() => {
    if (!firestore || !communityId || !postId) return null;
    return query(collection(firestore, 'communities', communityId, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  }, [firestore, communityId, postId]);

  const { data: comments, isLoading } = useCollection<Comment>(commentsColRef);

  // Sort comments based on selected option
  const sortedRootComments = useMemo(() => {
    if (!comments) return [];
    const rootComments = comments.filter(c => !c.parentId);

    switch (sortBy) {
      case 'best':
        return [...rootComments].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
      case 'newest':
        return [...rootComments].sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
      case 'oldest':
        return [...rootComments].sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeA - timeB;
        });
      default:
        return rootComments;
    }
  }, [comments, sortBy]);

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
      {sortedRootComments && sortedRootComments.length > 0 && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                {sortBy === 'best' && (t('sortBest') || 'Najlepsze')}
                {sortBy === 'newest' && (t('sortNewest') || 'Najnowsze')}
                {sortBy === 'oldest' && (t('sortOldest') || 'Najstarsze')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('best')}>
                {t('sortBest') || 'Najlepsze'} (⬆️ głosy)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('newest')}>
                {t('sortNewest') || 'Najnowsze'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                {t('sortOldest') || 'Najstarsze'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {sortedRootComments && sortedRootComments.length > 0 ? (
        sortedRootComments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
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
