'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/app/components/language-provider';
import { CreatePostForm } from '@/app/components/create-post-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';

type Community = {
  id: string;
  name: string;
  description: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  creatorDisplayName: string;
  creatorPhotoURL?: string;
  createdAt: any;
};

export default function CommunityPage() {
  const { id: communityId } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();

  const communityDocRef = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    return doc(firestore, 'communities', communityId);
  }, [firestore, communityId]);

  const postsColRef = useMemoFirebase(() => {
    if (!firestore || !communityId) return null;
    return query(collection(firestore, 'communities', communityId, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore, communityId]);

  const { data: community, isLoading: isCommunityLoading } = useDoc<Community>(communityDocRef);
  const { data: posts, isLoading: arePostsLoading } = useCollection<Post>(postsColRef);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true, locale: language === 'pl' ? pl : enUS });
  };
  
  const getInitials = (name?: string | null) => {
    return name ? name.charAt(0).toUpperCase() : <User className="h-5 w-5" />;
  };

  const isLoading = isCommunityLoading || arePostsLoading;

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

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{community.name}</h1>
        <p className="text-muted-foreground">{community.description}</p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('createNewPost')}</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? <CreatePostForm communityId={communityId} /> : <p>{t('logInToCreatePost')}</p>}
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('postsTitle')}</h2>
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                 <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={post.creatorPhotoURL} />
                        <AvatarFallback>{getInitials(post.creatorDisplayName)}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                        <CardTitle>{post.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {t('postedBy', { name: post.creatorDisplayName })} - {formatDate(post.createdAt)}
                        </p>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3">{post.content}</p>
              </CardContent>
              <CardFooter>
                 <Button asChild variant="link" className="p-0">
                    <Link href={`/community/${communityId}/post/${post.id}`}>
                        {t('viewPostAndComments')}
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p>{t('noPostsYet')}</p>
        )}
      </div>
    </div>
  );
}
