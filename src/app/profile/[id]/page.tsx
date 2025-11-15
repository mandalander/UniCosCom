'use client';

import { useParams } from 'next/navigation';
import {
  useFirestore,
  useDoc,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import { doc, collection, query, where, orderBy, getDoc, collectionGroup, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/app/components/language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, MessageSquare } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VoteButtons } from '@/app/components/vote-buttons';
import { ShareButton } from '@/app/components/share-button';
import { useEffect, useState } from 'react';

type UserProfile = {
  displayName: string;
  photoURL?: string;
  createdAt: any;
};

type Post = {
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
  voteCount: number;
};

export default function UserProfilePage() {
  const { id: userId } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const firestore = useFirestore();

  const userProfileDocRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'userProfiles', userId);
  }, [firestore, userId]);
  
  const userPostsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
        collectionGroup(firestore, 'posts'), 
        where('creatorId', '==', userId),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, userId]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileDocRef);
  const { data: rawPostDocs, isLoading: arePostsLoading } = useCollection<Omit<Post, 'communityId' | 'communityName'>>(userPostsQuery);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [areCommunityDetailsLoading, setAreCommunityDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchCommunityDetails = async () => {
        if (!firestore || !rawPostDocs || rawPostDocs.length === 0) {
          if (rawPostDocs) setPosts([]);
          return;
        }

        setAreCommunityDetailsLoading(true);
        
        const postsWithCommunityData = await Promise.all(
            rawPostDocs.map(async (postData) => {
                const communityRef = postData.ref.parent.parent;
                if (!communityRef) return { ...postData, communityId: 'unknown', communityName: 'Unknown' };

                const communitySnap = await getDoc(communityRef);
                const communityName = communitySnap.exists() ? communitySnap.data().name : 'Unknown';

                return {
                    ...postData,
                    communityId: communityRef.id,
                    communityName: communityName,
                } as Post;
            })
        );
        
        setPosts(postsWithCommunityData);
        setAreCommunityDetailsLoading(false);
    };

    fetchCommunityDetails();
  }, [rawPostDocs, firestore]);

  const getInitials = (name?: string | null) => {
    return name ? name.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5" />;
  };
  
   const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true, locale: language === 'pl' ? pl : enUS });
  };

  const formatCreationDate = (timestamp: any) => {
    if (!timestamp) return t('profileNotSet');
    try {
      const date = timestamp.toDate();
      return format(date, 'P', { locale: language === 'pl' ? pl : enUS });
    } catch (e) {
      return t('profileNotSet');
    }
  };

  const displayName = userProfile?.displayName || t('profileNoDisplayName');
  const isLoading = isProfileLoading || arePostsLoading || areCommunityDetailsLoading;

  if (isLoading && !userProfile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <div>{t('userNotFound')}</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userProfile.photoURL} alt={displayName} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{displayName}</CardTitle>
              <CardDescription>
                {t('profileJoinedDate')}: {formatCreationDate(userProfile.createdAt)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {t('userPosts', { username: displayName })}
        </h2>
        {isLoading ? (
             <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
               <Card key={post.id}>
                <CardHeader>
                   <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                          <AvatarImage src={post.creatorPhotoURL} />
                          <AvatarFallback>{getInitials(post.creatorDisplayName)}</AvatarFallback>
                      </Avatar>
                      <div className='flex-1'>
                          <p className="text-sm text-muted-foreground">
                            <span>{t('postedTo')} <Link href={`/community/${post.communityId}`} className="text-primary hover:underline">{post.communityName}</Link></span>
                            <span className="mx-1">•</span>
                            <span>{t('postedByPrefix')}{' '}
                                <Link href={`/profile/${post.creatorId}`} className="text-primary hover:underline">{post.creatorDisplayName}</Link>
                            </span>
                            • {formatDate(post.createdAt)}
                            {post.updatedAt && <span className='italic text-xs'> ({t('edited')})</span>}
                          </p>
                          <CardTitle className="text-lg mt-1">{post.title}</CardTitle>
                      </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-16">
                  <p className="line-clamp-3">{post.content}</p>
                </CardContent>
                <CardFooter className="pl-16">
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
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">{t('userHasNoPosts')}</p>
        )}
      </div>
    </div>
  );
}
