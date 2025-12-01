'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, collectionGroup, limit, orderBy } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Post, PostItem } from '@/app/components/post-feed';
import { CommunityCard } from '@/app/components/community-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useLanguage } from '@/app/components/language-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';

type Community = {
    id: string;
    name: string;
    description: string;
    createdAt?: any;
};

type UserProfile = {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
}

export default function SearchPage() {
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || '';
    const firestore = useFirestore();
    const { t } = useLanguage();

    const [posts, setPosts] = useState<Post[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>({});

    useEffect(() => {
        const fetchResults = async () => {
            setError(null);
            if (!firestore || !q) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Search Communities
                const communitiesRef = collection(firestore, 'communities');
                // Simple prefix search simulation
                const communitiesQ = query(
                    communitiesRef,
                    where('name', '>=', q),
                    where('name', '<=', q + '\uf8ff'),
                    limit(10)
                );
                const communitiesSnapshot = await getDocs(communitiesQ);
                const communitiesData = communitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
                setCommunities(communitiesData);

                // Search Posts
                const postsRef = collectionGroup(firestore, 'posts');
                const postsQ = query(postsRef, orderBy('createdAt', 'desc'), limit(50));
                const postsSnapshot = await getDocs(postsQ);

                const postsData = postsSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data(), communityId: doc.ref.parent.parent?.id } as Post))
                    .filter(post => {
                        const match = post.title.toLowerCase().includes(q.toLowerCase()) || post.content.toLowerCase().includes(q.toLowerCase());
                        return match;
                    });

                // Fetch community names for posts
                const postsWithCommunityNames = await Promise.all(postsData.map(async (post) => {
                    if (!post.communityId) return post;
                    return { ...post, communityName: 'Community' };
                }));
                setPosts(postsWithCommunityNames);

                // Search Users
                const usersRef = collection(firestore, 'userProfiles');
                const usersQ = query(
                    usersRef,
                    where('displayName', '>=', q),
                    where('displayName', '<=', q + '\uf8ff'),
                    limit(10)
                );
                const usersSnapshot = await getDocs(usersQ);
                const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
                setUsers(usersData);

                setDebugInfo({
                    rawPosts: postsSnapshot.size,
                    rawUsers: usersSnapshot.size,
                    rawCommunities: communitiesSnapshot.size,
                    firstPost: postsSnapshot.docs[0]?.data(),
                    firstUser: usersSnapshot.docs[0]?.data(),
                });

            } catch (error: any) {
                console.error("Search error:", error);
                setError(error.message || "An error occurred during search.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [firestore, q]);

    if (!q) {
        return <div className="text-center mt-10">{t('enterSearchTerm') || "Please enter a search term."}</div>;
    }

    if (error) {
        return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">{t('searchResultsFor') || "Search results for"}: "{q}"</h1>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 glass mb-8">
                    <TabsTrigger value="all">{t('all') || "All"}</TabsTrigger>
                    <TabsTrigger value="posts">{t('posts') || "Posts"} ({posts.length})</TabsTrigger>
                    <TabsTrigger value="communities">{t('communities') || "Communities"} ({communities.length})</TabsTrigger>
                    <TabsTrigger value="users">{t('users') || "Users"} ({users.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-4">{t('communities') || "Communities"}</h2>
                        {isLoading ? <Skeleton className="h-20 w-full" /> : communities.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {communities.slice(0, 4).map(community => (
                                    <CommunityCard key={community.id} community={community} />
                                ))}
                            </div>
                        ) : <p className="text-muted-foreground">{t('noResults') || "No results found."}</p>}
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">{t('users') || "Users"}</h2>
                        {isLoading ? <Skeleton className="h-20 w-full" /> : users.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {users.slice(0, 4).map(user => (
                                    <Link href={`/profile/${user.uid}`} key={user.uid}>
                                        <Card className="glass-card hover:bg-muted/50 transition-colors">
                                            <CardContent className="flex items-center gap-4 p-4">
                                                <Avatar>
                                                    <AvatarImage src={user.photoURL} />
                                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.displayName}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : <p className="text-muted-foreground">{t('noResults') || "No results found."}</p>}
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">{t('posts') || "Posts"}</h2>
                        {isLoading ? <Skeleton className="h-40 w-full" /> : posts.length > 0 ? (
                            <div className="space-y-4">
                                {posts.slice(0, 3).map(post => (
                                    <PostItem key={post.id} post={post} />
                                ))}
                            </div>
                        ) : <p className="text-muted-foreground">{t('noResults') || "No results found."}</p>}
                    </section>
                </TabsContent>

                <TabsContent value="posts" className="space-y-4">
                    {isLoading ? <Skeleton className="h-40 w-full" /> : posts.length > 0 ? (
                        posts.map(post => (
                            <PostItem key={post.id} post={post} />
                        ))
                    ) : <p className="text-center text-muted-foreground py-10">{t('noResults') || "No results found."}</p>}
                </TabsContent>

                <TabsContent value="communities">
                    {isLoading ? <Skeleton className="h-20 w-full" /> : communities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {communities.map(community => (
                                <CommunityCard key={community.id} community={community} />
                            ))}
                        </div>
                    ) : <p className="text-center text-muted-foreground py-10">{t('noResults') || "No results found."}</p>}
                </TabsContent>

                <TabsContent value="users">
                    {isLoading ? <Skeleton className="h-20 w-full" /> : users.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {users.map(user => (
                                <Link href={`/profile/${user.uid}`} key={user.uid}>
                                    <Card className="glass-card hover:bg-muted/50 transition-colors">
                                        <CardContent className="flex items-center gap-4 p-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={user.photoURL} />
                                                <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-lg">{user.displayName}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : <p className="text-center text-muted-foreground py-10">{t('noResults') || "No results found."}</p>}
                </TabsContent>
            </Tabs>

            <div className="mt-8 p-4 border rounded bg-muted/50 text-xs font-mono whitespace-pre-wrap">
                <h3 className="font-bold mb-2">Debug Info:</h3>
                <p>Query: "{q}"</p>
                <p>Raw Posts Fetched: {debugInfo.rawPosts}</p>
                <p>Raw Users Fetched: {debugInfo.rawUsers}</p>
                <p>Raw Communities Fetched: {debugInfo.rawCommunities}</p>
                <p>First Post Title: {debugInfo.firstPost?.title}</p>
                <p>First User Name: {debugInfo.firstUser?.displayName}</p>
                <p>Error: {error || 'None'}</p>
            </div>
        </div>
    );
}
