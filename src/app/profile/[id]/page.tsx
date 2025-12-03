'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  useFirestore,
  useDoc,
  useCollection,
  useUser,
} from '@/firebase';
import { doc, collection, query, where, orderBy, getDoc, collectionGroup, setDoc, serverTimestamp, limit } from 'firebase/firestore';
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
import { User as UserIcon, MessageSquare, Mail, MapPin, Globe, Twitter, Linkedin, Github, Link as LinkIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VoteButtons } from '@/components/vote-buttons';
import { ShareButton } from '@/app/components/share-button';
import { useEffect, useState, useMemo } from 'react';

type UserProfile = {
  displayName: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
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
  const { user } = useUser();
  const router = useRouter();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const userProfileDocRef = useMemo(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'userProfiles', userId);
  }, [firestore, userId]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [areCommunityDetailsLoading, setAreCommunityDetailsLoading] = useState(false);
  const [postsLimit, setPostsLimit] = useState(10);

  const userPostsQuery = useMemo(() => {
    if (!firestore || !userId) return null;
    return query(
      collectionGroup(firestore, 'posts'),
      where('creatorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(postsLimit)
    );
  }, [firestore, userId, postsLimit]);

  const { data: rawPostDocs, isLoading: arePostsLoading } = useCollection<Omit<Post, 'communityId' | 'communityName'>>(userPostsQuery);

  useEffect(() => {
    const fetchCommunityDetails = async () => {
      if (!firestore || !rawPostDocs || rawPostDocs.length === 0) {
        if (rawPostDocs) setPosts([]);
        return;
      }

      setAreCommunityDetailsLoading(true);

      // 1. Identify posts missing communityName
      const postsNeedingCommunityName = rawPostDocs.filter((p: any) => !p.communityName);

      // 2. Collect unique community IDs for those posts
      const communityIdsToFetch = Array.from(new Set(postsNeedingCommunityName.map(p => p.ref.ref.parent.parent?.id).filter(Boolean))) as string[];

      // 3. Fetch missing communities (batch)
      const communityNameMap = new Map<string, string>();
      if (communityIdsToFetch.length > 0) {
        // Firestore 'in' query supports max 10 items. We might need to chunk if > 10.
        // For simplicity/MVP, let's just do Promise.all with getDoc for now, but memoized/cached if possible.
        // Or better, just fetch them individually but in parallel, which is what we had, BUT we can deduplicate requests.

        await Promise.all(communityIdsToFetch.map(async (cid) => {
          const communityRef = doc(firestore, 'communities', cid);
          const snap = await getDoc(communityRef);
          if (snap.exists()) {
            communityNameMap.set(cid, snap.data().name);
          } else {
            communityNameMap.set(cid, 'Unknown');
          }
        }));
      }

      // 4. Merge data
      const postsWithData = rawPostDocs.map((postData: any) => {
        const communityRef = postData.ref.ref.parent.parent;
        const communityId = communityRef?.id || 'unknown';

        // Use denormalized name if available, otherwise fallback to fetched map
        const communityName = postData.communityName || communityNameMap.get(communityId) || 'Unknown';

        return {
          ...postData,
          communityId: communityId,
          communityName: communityName,
        } as Post;
      });

      setPosts(postsWithData);
      setAreCommunityDetailsLoading(false);
    };

    fetchCommunityDetails();
  }, [rawPostDocs, firestore]);

  const handleLoadMore = () => {
    setPostsLimit(prev => prev + 10);
  };

  const handleMessage = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!firestore || !userId || !userProfile) return;

    setIsStartingChat(true);
    try {
      const participantIds = [user.uid, userId].sort();
      const conversationId = participantIds.join('_');
      const conversationRef = doc(firestore, 'conversations', conversationId);

      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        await setDoc(conversationRef, {
          participants: participantIds,
          participantDetails: {
            [user.uid]: {
              displayName: user.displayName || 'User',
              photoURL: user.photoURL || null,
            },
            [userId]: {
              displayName: userProfile.displayName,
              photoURL: userProfile.photoURL || null,
            }
          },
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          unreadCounts: {
            [user.uid]: 0,
            [userId]: 0
          }
        });
      }

      // Redirect to messages page (ideally selecting this conversation)
      // Since we don't have URL state for selection yet, we rely on it being the "latest" 
      // or we can implement URL param selection in MessagesPage later.
      // For now, let's just go to messages.
      router.push('/messages');

    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setIsStartingChat(false);
    }
  };

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
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20 md:h-24 md:w-24">
                <AvatarImage src={userProfile.photoURL} alt={displayName} />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  <CardTitle className="text-2xl md:text-3xl">{displayName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span>{t('profileJoinedDate')}: {formatCreationDate(userProfile.createdAt)}</span>
                  </CardDescription>
                </div>

                {userProfile.bio && (
                  <p className="text-sm text-muted-foreground max-w-lg whitespace-pre-wrap">
                    {userProfile.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {userProfile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      <span>{userProfile.location}</span>
                    </div>
                  )}
                  {userProfile.website && (
                    <div className="flex items-center gap-1">
                      <Globe size={16} />
                      <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                        {userProfile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  {userProfile.twitter && (
                    <a href={`https://twitter.com/${userProfile.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <Twitter size={20} />
                    </a>
                  )}
                  {userProfile.linkedin && (
                    <a href={userProfile.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <Linkedin size={20} />
                    </a>
                  )}
                  {userProfile.github && (
                    <a href={`https://github.com/${userProfile.github}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <Github size={20} />
                    </a>
                  )}
                </div>
              </div>
            </div>
            {user && user.uid !== userId && (
              <Button onClick={handleMessage} disabled={isStartingChat} className="w-full md:w-auto">
                <Mail className="mr-2 h-4 w-4" />
                {t('startConversation') || "Message"}
              </Button>
            )}
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

        {posts && posts.length >= postsLimit && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={handleLoadMore} disabled={arePostsLoading || areCommunityDetailsLoading}>
              {arePostsLoading ? t('loading') : t('loadMore') || "Load More"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
