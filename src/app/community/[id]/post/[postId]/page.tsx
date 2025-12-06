'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/app/components/language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MessageSquare, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { CommentList } from '@/app/components/comment-list';
import { CreateCommentForm } from '@/app/components/create-comment-form';
import { PostItemActions } from '@/app/components/post-item-actions';
import { VoteButtons } from '@/components/vote-buttons';
import { ShareButton } from '@/app/components/share-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import NextImage from 'next/image';
import { useMemo, useEffect } from 'react';
import { useStartConversation } from '@/hooks/use-start-conversation';
import { useRecentPosts } from '@/hooks/use-recent-posts';

import { Post } from '@/lib/types';
import { AdBanner } from '@/app/components/ad-banner';

export default function PostPage() {
  const { id: communityId, postId } = useParams<{ id: string; postId: string }>();
  const { t, language } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();
  const { addRecentPost } = useRecentPosts();

  const postDocRef = useMemo(() => {
    if (!firestore || !communityId || !postId) return null;
    return doc(firestore, 'communities', communityId, 'posts', postId);
  }, [firestore, communityId, postId]);

  const { data: post, isLoading: isPostLoading } = useDoc<Post>(postDocRef);

  useEffect(() => {
    if (post) {
      addRecentPost(post as Post);
    }
  }, [post, addRecentPost]);


  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true, locale: language === 'pl' ? pl : enUS });
  };

  const getInitials = (name?: string | null) => {
    return name ? name.charAt(0).toUpperCase() : <User className="h-5 w-5" />;
  };

  const isOwner = user && post && user.uid === post.creatorId;

  const { startConversation, isStarting } = useStartConversation();

  const handleMessageAuthor = () => {
    if (!post) return;
    startConversation({
      targetUserId: post.creatorId,
      targetUserDisplayName: post.creatorDisplayName,
      targetUserPhotoURL: post.creatorPhotoURL
    });
  };

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
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.creatorPhotoURL} />
                    <AvatarFallback>{getInitials(post.creatorDisplayName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      <span>
                        {t('postedByPrefix')}{' '}
                        <Link href={`/profile/${post.creatorId}`} className="text-primary hover:underline">{post.creatorDisplayName}</Link>
                      </span>
                      {' • '}
                      {formatDate(post.createdAt)}
                      {post.updatedAt && <span className='text-muted-foreground italic'> ({t('edited')})</span>}
                    </p>
                    <CardTitle className="text-xl mt-1">{post.title}</CardTitle>
                  </div>
                </div>
                {isOwner && <PostItemActions communityId={communityId} post={post} />}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pl-16">
          <p className="whitespace-pre-wrap">{post.content}</p>
          {post.mediaUrl && (
            <div className="mt-4 rounded-lg overflow-hidden border bg-black/5">
              {post.mediaType === 'image' ? (
                <NextImage
                  src={post.mediaUrl}
                  alt="Post content"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-full h-auto max-h-[600px] object-contain"
                />
              ) : post.mediaType === 'video' ? (
                <video src={post.mediaUrl} controls className="w-full h-auto max-h-[600px]" />
              ) : null}
            </div>
          )}
        </CardContent>
        <CardFooter className="pl-16">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <VoteButtons
              targetType="post"
              targetId={post.id}
              creatorId={post.creatorId}
              communityId={communityId}
              initialVoteCount={post.voteCount}
            />
            <Link href={`/community/${communityId}/post/${post.id}`} passHref>
              <Button variant="ghost" className="rounded-full h-auto p-2 text-sm flex items-center gap-2">
                <MessageSquare className='h-5 w-5' /> <span>{t('commentsTitle')}</span>
              </Button>
            </Link>
            <ShareButton post={{ ...post, communityId }} />
          </div>
        </CardFooter>
      </Card>

      <div className="my-8">
        <AdBanner
          dataAdSlot="1234567890"
          dataAdFormat="auto"
          dataFullWidthResponsive={true}
        />
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{t('commentsTitle')}</h2>

        <Card>
          <CardHeader>
            <CardTitle>{t('addComment')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateCommentForm
              communityId={communityId}
              postId={postId}
              postAuthorId={post.creatorId}
              postTitle={post.title}
            />
          </CardContent>
        </Card>

        <CommentList
          communityId={communityId}
          postId={postId}
          postAuthorId={post.creatorId}
          postTitle={post.title}
        />
      </div>
    </div>
  );
}
