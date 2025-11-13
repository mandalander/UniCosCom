'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/app/components/language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { CommentList } from '@/app/components/comment-list';
import { CreateCommentForm } from '@/app/components/create-comment-form';
import { PostItemActions } from '@/app/components/post-item-actions';
import { VoteButtons } from '@/app/components/vote-buttons';

type Post = {
  id: string;
  title: string;
  content: string;
  creatorId: string;
  creatorDisplayName: string;
  creatorPhotoURL?: string;
  createdAt: any;
  updatedAt?: any;
  voteCount: number;
};

export default function PostPage() {
  const { id: communityId, postId } = useParams<{ id: string; postId: string }>();
  const { t, language } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();

  const postDocRef = useMemoFirebase(() => {
    if (!firestore || !communityId || !postId) return null;
    return doc(firestore, 'communities', communityId, 'posts', postId);
  }, [firestore, communityId, postId]);

  const { data: post, isLoading: isPostLoading } = useDoc<Post>(postDocRef);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true, locale: language === 'pl' ? pl : enUS });
  };
  
  const getInitials = (name?: string | null) => {
    return name ? name.charAt(0).toUpperCase() : <User className="h-5 w-5" />;
  };

  const isOwner = user && post && user.uid === post.creatorId;

  if (isPostLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-4 pt-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!post) {
    return <div>{t('postNotFound')}</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                    <VoteButtons
                        targetType="post"
                        targetId={post.id}
                        communityId={communityId}
                        initialVoteCount={post.voteCount}
                    />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {t('postedBy', { name: post.creatorDisplayName })} • {formatDate(post.createdAt)}
                                {post.updatedAt && <span className='text-muted-foreground italic'> ({t('edited')})</span>}
                            </p>
                            <CardTitle className="text-xl mt-1">{post.title}</CardTitle>
                        </div>
                        {isOwner && <PostItemActions communityId={communityId} post={post} />}
                   </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="pl-20">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </CardContent>
        <CardFooter className="pl-20">
           {/* Placeholder for actions like comments count etc. */}
        </CardFooter>
      </Card>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{t('commentsTitle')}</h2>
        
        <Card>
            <CardHeader>
                <CardTitle>{t('addComment')}</CardTitle>
            </CardHeader>
            <CardContent>
               <CreateCommentForm communityId={communityId} postId={postId} />
            </CardContent>
        </Card>

        <CommentList communityId={communityId} postId={postId} />
      </div>
    </div>
  );
}
