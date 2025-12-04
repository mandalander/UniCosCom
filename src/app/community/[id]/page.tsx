'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useUser } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/app/components/language-provider';
import { CreatePostForm } from '@/app/components/create-post-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MessageSquare, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { VoteButtons } from '@/components/vote-buttons';
import { ShareButton } from '@/app/components/share-button';
import { PostItemActions } from '@/app/components/post-item-actions';
import { useMemo } from 'react';
import { JoinButton } from '@/app/components/join-button';
import { PostItem } from '@/app/components/post-item';
import { Post, Community } from '@/lib/types';
import { AdBanner } from '@/app/components/ad-banner';
import React from 'react';

export default function CommunityPage() {
  const { id: communityId } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const communityDocRef = useMemo(() => {
    if (!firestore || !communityId) return null;
    return doc(firestore, 'communities', communityId);
  }, [firestore, communityId]);

  const postsColRef = useMemo(() => {
    if (!firestore || !communityId) return null;
    return query(collection(firestore, 'communities', communityId, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore, communityId]);

  const { data: community, isLoading: isCommunityLoading } = useDoc<Community>(communityDocRef);
  const { data: posts, isLoading: arePostsLoading } = useCollection<Post>(postsColRef);

  const isLoading = isCommunityLoading || arePostsLoading || isUserLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!community) {
    return <div>{t('communityNotFound')}</div>;
  }

  // Map posts to include communityName (since it's not in the subcollection doc usually, but we need it for PostItem)
  const mappedPosts = posts?.map(p => ({
    ...p,
    communityName: community.name,
    communityId: community.id,
    communityCreatorId: community.creatorId
  })) as Post[];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{community.name}</h1>
            <p className="text-muted-foreground">{community.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <JoinButton communityId={communityId} communityName={community.name} />
            {user && user.uid === community.creatorId && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/community/${communityId}/moderation`}>
                  <Shield className="mr-2 h-4 w-4" />
                  {t('moderationDashboard')}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t('createNewPost')}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardContent>
            <CreatePostForm communityId={communityId} communityName={community.name} />
          </CardContent>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('postsTitle')}</h2>
        {mappedPosts && mappedPosts.length > 0 ? (
          mappedPosts.map((post, index) => (
            <React.Fragment key={post.id}>
              <PostItem post={post} />
              {(index + 1) % 5 === 0 && (
                <AdBanner
                  dataAdSlot="1234567890"
                  dataAdFormat="fluid"
                  dataFullWidthResponsive={true}
                  className="my-6"
                />
              )}
            </React.Fragment>
          ))
        ) : (
          <p>{t('noPostsYet')}</p>
        )}
      </div>
    </div>
  );
}
