
'use client';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { useLanguage } from '../components/language-provider';
import { useUser, useDoc, useFirestore, useCollection } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { doc, collection, collectionGroup, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Link as LinkIcon, Twitter, Linkedin, Github, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserStats } from '../components/user-stats';
import { UserBadges, calculateBadges, BadgeType } from '../components/user-badges';
import { ActivityTimeline } from '../components/activity-timeline';
import { VoteButtons } from '@/components/vote-buttons';
import { ShareButton } from '../components/share-button';

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

type Comment = {
  id: string;
  content: string;
  authorId: string;
  authorDisplayName: string;
  authorPhotoURL?: string;
  createdAt: any;
  postId: string;
  postTitle?: string;
  communityId: string;
  communityName?: string;
};

type Community = {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  memberCount?: number;
};

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const userDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  // Fetch user's posts
  const postsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collectionGroup(firestore, 'posts'),
      where('creatorId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [firestore, user]);

  const { data: rawPosts, isLoading: isPostsLoading } = useCollection(postsQuery);

  // Fetch user's comments
  const commentsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collectionGroup(firestore, 'comments'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [firestore, user]);

  const { data: rawComments, isLoading: isCommentsLoading } = useCollection(commentsQuery);

  // Fetch user's communities
  const communitiesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'communities'),
      where('memberIds', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: rawCommunities, isLoading: isCommunitiesLoading } = useCollection(communitiesQuery);

  // Process posts with community names
  useEffect(() => {
    const processPosts = async () => {
      if (!rawPosts || !firestore) {
        setPosts([]);
        return;
      }

      const processedPosts = await Promise.all(
        rawPosts.map(async (postData: any) => {
          const communityRef = postData.ref?.ref?.parent?.parent;
          const communityId = communityRef?.id || 'unknown';
          let communityName = postData.communityName || 'Unknown';

          if (!postData.communityName && communityId !== 'unknown') {
            try {
              const communityDoc = await getDoc(doc(firestore, 'communities', communityId));
              if (communityDoc.exists()) {
                communityName = communityDoc.data().name;
              }
            } catch (e) { }
          }

          return {
            ...postData,
            communityId,
            communityName,
          } as Post;
        })
      );

      setPosts(processedPosts);
    };

    processPosts();
  }, [rawPosts, firestore]);

  // Process comments with post/community info
  useEffect(() => {
    const processComments = async () => {
      if (!rawComments || !firestore) {
        setComments([]);
        return;
      }

      const processedComments = await Promise.all(
        rawComments.map(async (commentData: any) => {
          const postRef = commentData.ref?.ref?.parent?.parent;
          const communityRef = postRef?.parent?.parent;
          const postId = postRef?.id || 'unknown';
          const communityId = communityRef?.id || 'unknown';

          return {
            ...commentData,
            postId,
            communityId,
          } as Comment;
        })
      );

      setComments(processedComments);
    };

    processComments();
  }, [rawComments, firestore]);

  // Process communities
  useEffect(() => {
    if (rawCommunities) {
      setCommunities(rawCommunities as Community[]);
    }
  }, [rawCommunities]);

  // Calculate badges
  useEffect(() => {
    if (userProfile && posts.length > 0) {
      const calculatedBadges = calculateBadges(userProfile, {
        postsCount: posts.length,
        commentsCount: comments.length,
      });
      setBadges(calculatedBadges);
    }
  }, [userProfile, posts.length, comments.length]);

  const isLoading = isUserLoading || isProfileLoading;

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return <UserIcon className="h-5 w-5" />;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(`${dateString}T00:00:00`), 'P', { locale: language === 'pl' ? pl : enUS });
    } catch (e) {
      return dateString;
    }
  };

  const formatCreationDate = (dateString?: string) => {
    if (!dateString) return t('profileNotSet');
    try {
      return format(new Date(dateString), 'P', { locale: language === 'pl' ? pl : enUS });
    } catch (e) {
      return dateString;
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: language === 'pl' ? pl : enUS });
  };

  const displayPhotoUrl = userProfile?.photoURL ?? user?.photoURL;
  const displayCoverUrl = userProfile?.coverURL;
  const displayFirstName = userProfile?.firstName;
  const displayLastName = userProfile?.lastName;
  const displayFullName = [displayFirstName, displayLastName].filter(Boolean).join(' ');
  const displayName = userProfile?.displayName || user?.displayName || displayFullName || t('profileNoDisplayName');

  return (
    <div className="relative">
      {/* Cover Image / Gradient Banner */}
      <div className="h-48 w-full rounded-t-xl relative overflow-hidden">
        {displayCoverUrl ? (
          <img
            src={displayCoverUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full blur-2xl" />
          </div>
        )}
      </div>

      <Card className="glass-card border-none -mt-12 mx-4 relative z-10">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 mb-6">
                <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
                <div className="space-y-2 text-center md:text-left mb-2">
                  <Skeleton className="h-8 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20 relative z-20">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={displayPhotoUrl ?? undefined} alt={displayName} />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                    {getInitials(displayName, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-2 text-center md:text-left mb-2 flex-1'>
                  <h1 className="text-3xl font-bold font-heading">{displayName}</h1>
                  <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                    {user.email}
                  </p>
                  {badges.length > 0 && (
                    <div className="pt-1">
                      <UserBadges badges={badges} size="sm" />
                    </div>
                  )}
                </div>
                <div className="md:ml-auto mb-2">
                  <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:scale-105">
                    <Link href="/profile/edit">{t('editProfile')}</Link>
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <UserStats userId={user.uid} />

              {/* Bio */}
              {userProfile?.bio && (
                <div className="bg-muted/30 p-4 rounded-lg backdrop-blur-sm border border-white/5">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full" />
                    {t('profileBio')}
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{userProfile.bio}</p>
                </div>
              )}

              {/* Tabs: Posts / Comments / Communities / Activity */}
              <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                  <TabsTrigger value="posts" className="text-xs sm:text-sm">{t('posts')}</TabsTrigger>
                  <TabsTrigger value="comments" className="text-xs sm:text-sm">{t('commentsTitle')}</TabsTrigger>
                  <TabsTrigger value="communities" className="text-xs sm:text-sm">{t('communities')}</TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs sm:text-sm">{t('activity') || 'Activity'}</TabsTrigger>
                </TabsList>

                {/* Posts Tab */}
                <TabsContent value="posts" className="mt-4">
                  {isPostsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : posts.length > 0 ? (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <Card key={post.id} className="hover:bg-muted/30 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <Link href={`/community/${post.communityId}/post/${post.id}`} className="hover:underline">
                                  <h4 className="font-semibold">{post.title}</h4>
                                </Link>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <Link href={`/community/${post.communityId}`} className="hover:text-primary">
                                    {post.communityName}
                                  </Link>
                                  <span>•</span>
                                  <span>{formatTimestamp(post.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">{t('userHasNoPosts')}</p>
                  )}
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments" className="mt-4">
                  {isCommentsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <Card key={comment.id} className="hover:bg-muted/30 transition-colors">
                          <CardContent className="p-4">
                            <p className="text-sm line-clamp-3">{comment.content}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Link href={`/community/${comment.communityId}/post/${comment.postId}`} className="hover:text-primary">
                                {t('viewPost') || 'View post'}
                              </Link>
                              <span>•</span>
                              <span>{formatTimestamp(comment.createdAt)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">{t('noComments') || 'No comments yet'}</p>
                  )}
                </TabsContent>

                {/* Communities Tab */}
                <TabsContent value="communities" className="mt-4">
                  {isCommunitiesLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : communities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {communities.map((community) => (
                        <Link key={community.id} href={`/community/${community.id}`}>
                          <Card className="hover:bg-muted/30 transition-colors cursor-pointer h-full">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={community.iconUrl} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {community.name?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{community.name}</h4>
                                {community.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">{community.description}</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">{t('noCommunities') || 'Not a member of any communities'}</p>
                  )}
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-4">
                  <ActivityTimeline userId={user.uid} maxItems={10} />
                </TabsContent>
              </Tabs>

              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">{t('profileDetails')}</h3>
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileFirstName')}</span>
                      <span className="font-medium">{displayFirstName || t('profileNotSet')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileLastName')}</span>
                      <span className="font-medium">{displayLastName || t('profileNotSet')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileDisplayName')}</span>
                      <span className="font-medium">{userProfile?.displayName || t('profileNotSet')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileGender')}</span>
                      <span className="font-medium">{userProfile?.gender ? t(`gender${userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)}` as any) : t('profileNotSet')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">{t('profileInfo')}</h3>
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileBirthDate')}</span>
                      <span className="font-medium">{userProfile?.birthDate ? formatDate(userProfile.birthDate) : t('profileNotSet')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileLocation')}</span>
                      <span className="font-medium">{userProfile?.location || t('profileNotSet')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileJoinedDate')}</span>
                      <span className="font-medium">{formatCreationDate(user.metadata.creationTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {(userProfile?.website || userProfile?.twitter || userProfile?.linkedin || userProfile?.github) && (
                <div className="pt-4 border-t">
                  <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
                    {userProfile?.website && (
                      <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all duration-300">
                        <LinkIcon size={16} />
                        <span>{t('profileWebsite')}</span>
                      </a>
                    )}
                    {userProfile?.twitter && (
                      <a href={userProfile.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] transition-all duration-300">
                        <Twitter size={16} />
                        <span>{t('profileTwitter')}</span>
                      </a>
                    )}
                    {userProfile?.linkedin && (
                      <a href={userProfile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] transition-all duration-300">
                        <Linkedin size={16} />
                        <span>{t('profileLinkedIn')}</span>
                      </a>
                    )}
                    {userProfile?.github && (
                      <a href={userProfile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-[#333]/10 hover:text-[#333] dark:hover:text-white transition-all duration-300">
                        <Github size={16} />
                        <span>{t('profileGitHub')}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t('profileNotLoggedIn')}</p>
              <Button asChild>
                <Link href="/login">{t('login')}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
