'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, getDocs, collection, limit } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/app/components/language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useEffect, useState } from 'react';

type Post = {
  id: string;
  title: string;
  content: string;
  creatorDisplayName: string;
  creatorPhotoURL?: string;
  createdAt: any;
  communityId: string;
  communityName: string;
};

type Comment = {
    id: string;
    content: string;
    creatorDisplayName: string;
    creatorPhotoURL?: string;
    createdAt: any;
}

const PostItem = ({ post }: { post: Post }) => {
    const { t, language } = useLanguage();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const firestore = useFirestore();

    useEffect(() => {
        const fetchComments = async () => {
            if (!firestore) return;
            setIsLoadingComments(true);
            const commentsRef = collection(firestore, 'communities', post.communityId, 'posts', post.id, 'comments');
            const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(2));
            const querySnapshot = await getDocs(q);
            const fetchedComments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(fetchedComments.reverse());
            setIsLoadingComments(false);
        };
        fetchComments();
    }, [firestore, post.communityId, post.id]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return formatDistanceToNow(date, { addSuffix: true, locale: language === 'pl' ? pl : enUS });
    };

    const getInitials = (name?: string | null) => {
        return name ? name.charAt(0).toUpperCase() : <User className="h-5 w-5" />;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={post.creatorPhotoURL} />
                        <AvatarFallback>{getInitials(post.creatorDisplayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className='leading-tight'>{post.title}</CardTitle>
                        <CardDescription className='mt-1'>
                            {t('postedBy', { name: post.creatorDisplayName })} - {formatDate(post.createdAt)} in <Link href={`/community/${post.communityId}`} className="text-primary hover:underline font-semibold">{post.communityName}</Link>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="line-clamp-4">{post.content}</p>
            </CardContent>
            <CardFooter className='flex-col items-start gap-4'>
                 <Link href={`/community/${post.communityId}/post/${post.id}`} passHref>
                    <Button variant="link" className="p-0 h-auto">
                        <MessageSquare className='mr-2 h-4 w-4' /> {t('viewPostAndComments')}
                    </Button>
                </Link>
                <div className="w-full space-y-3">
                    {isLoadingComments ? (
                        <Skeleton className="h-10 w-full" />
                    ) : (
                        comments.map(comment => (
                             <div key={comment.id} className="flex items-start gap-3 text-sm">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={comment.creatorPhotoURL} />
                                    <AvatarFallback>{getInitials(comment.creatorDisplayName)}</AvatarFallback>
                                </Avatar>
                                <div className='flex-1 rounded-md border bg-muted/50 p-2'>
                                    <p>
                                        <span className="font-semibold">{comment.creatorDisplayName}</span>
                                        <span className='text-muted-foreground'>: {comment.content}</span>
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardFooter>
        </Card>
    )
}


export function PostFeed() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!firestore) return;
      setIsLoading(true);

      const postsQuery = query(collectionGroup(firestore, 'posts'), orderBy('createdAt', 'desc'), limit(10));
      const postSnapshots = await getDocs(postsQuery);

      const postsData = await Promise.all(postSnapshots.docs.map(async (postDoc) => {
        const post = { id: postDoc.id, ...postDoc.data() } as Omit<Post, 'communityName' | 'communityId'>;
        const communityRef = postDoc.ref.parent.parent;
        if (!communityRef) return null;
        
        return {
          ...post,
          communityId: communityRef.id,
          communityName: communityRef.id, // Placeholder, can be fetched if needed
        } as Post;
      }));

      setPosts(postsData.filter((p): p is Post => p !== null));
      setIsLoading(false);
    };

    fetchPosts();
  }, [firestore]);


  if (isLoading) {
    return (
       <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
             <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
              <CardFooter>
                 <Skeleton className="h-8 w-40" />
              </CardFooter>
            </Card>
          ))}
        </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))
      ) : (
        <p className='text-center text-muted-foreground'>{t('noPostsGlobal')}</p>
      )}
    </div>
  );
}
