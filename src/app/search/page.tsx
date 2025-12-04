'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, collectionGroup, limit, orderBy } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Post } from '@/lib/types';
import { PostItem } from '@/app/components/post-item';
import { AdBanner } from '@/app/components/ad-banner';
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
                const capitalizedQ = q.charAt(0).toUpperCase() + q.slice(1);
                const isLowercase = q !== capitalizedQ;

                // --- Search Communities ---
                const communitiesRef = collection(firestore, 'communities');
                const communityQueries = [
                    query(communitiesRef, where('name', '>=', q), where('name', '<=', q + '\uf8ff'), limit(10))
                ];
                if (isLowercase) {
                    communityQueries.push(
                        query(communitiesRef, where('name', '>=', capitalizedQ), where('name', '<=', capitalizedQ + '\uf8ff'), limit(10))
                    );
                }

                const communitySnapshots = await Promise.all(communityQueries.map(q => getDocs(q)));
                const communitiesMap = new Map();
                communitySnapshots.forEach(snap => {
                    snap.docs.forEach(doc => {
                        communitiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Community);
                    });
                });
                const communitiesData = Array.from(communitiesMap.values());
                communitiesData.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
                setCommunities(communitiesData);

                // --- Search Users ---
                const usersRef = collection(firestore, 'userProfiles');
                const userQueries = [
                    query(usersRef, where('displayName', '>=', q), where('displayName', '<=', q + '\uf8ff'), limit(10))
                ];
                if (isLowercase) {
                    userQueries.push(
                        query(usersRef, where('displayName', '>=', capitalizedQ), where('displayName', '<=', capitalizedQ + '\uf8ff'), limit(10))
                    );
                }

                const userSnapshots = await Promise.all(userQueries.map(q => getDocs(q)));
                const usersMap = new Map();
                userSnapshots.forEach(snap => {
                    snap.docs.forEach(doc => {
                        usersMap.set(doc.id, { uid: doc.id, ...doc.data() } as UserProfile);
                    });
                });
                const usersData = Array.from(usersMap.values());
                usersData.sort((a: any, b: any) => (a.displayName || '').localeCompare(b.displayName || ''));
                setUsers(usersData);

                // --- Search Posts ---
                const postsRef = collectionGroup(firestore, 'posts');
                const postQueries = [
                    query(postsRef, where('title', '>=', q), where('title', '<=', q + '\uf8ff'), limit(20))
                ];
                if (isLowercase) {
                    postQueries.push(
                        query(postsRef, where('title', '>=', capitalizedQ), where('title', '<=', capitalizedQ + '\uf8ff'), limit(20))
                    );
                }

                const postSnapshots = await Promise.all(postQueries.map(q => getDocs(q)));
                const postsMap = new Map();

                postSnapshots.forEach(snap => {
                    snap.docs.forEach(doc => {
                        postsMap.set(doc.id, {
                            id: doc.id,
                            ...doc.data(),
                            communityId: doc.ref.parent.parent?.id
                        } as Post);
                    });
                });

                const postsData = Array.from(postsMap.values());
                // Sort posts by createdAt desc
                postsData.sort((a: any, b: any) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                    return timeB - timeA;
                });

                const postsWithCommunityNames = postsData.map(post => ({
                    ...post,
                    communityName: 'Community'
                }));

                setPosts(postsWithCommunityNames);

                setDebugInfo({
                    q,
                    capitalizedQ: isLowercase ? capitalizedQ : null,
                    communitiesFound: communitiesMap.size,
                    usersFound: usersMap.size,
                    postsFound: postsMap.size,
                });

            } catch (error: any) {
                console.error("Search error:", error);
                if (error.code === 'failed-precondition' && error.message.includes('index')) {
                    setError(`Missing Index: ${error.message}`);
                } else {
                    setError(error.message || "An error occurred during search.");
                }
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
                        posts.map((post, index) => (
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
