'use client';

import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { useLanguage } from '../components/language-provider';
import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateCommunityDialog } from '../components/create-community-dialog';
import { useRouter } from 'next/navigation';

type Community = {
    id: string;
    name: string;
    description?: string;
    memberCount?: number;
};

export default function MyCommunitiesPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { t } = useLanguage();
    const router = useRouter();

    const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
    const [isLoadingJoinedCommunities, setIsLoadingJoinedCommunities] = useState(true);

    // Query for memberships
    const membershipsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'communityMemberships'), orderBy('joinedAt', 'desc'));
    }, [user, firestore]);

    const { data: memberships, isLoading: isLoadingMemberships } = useCollection<{ communityName: string }>(membershipsQuery);

    useEffect(() => {
        if (memberships) {
            const joined = memberships.map(m => ({
                id: m.id,
                name: m.communityName
            }));
            setJoinedCommunities(joined);
            setIsLoadingJoinedCommunities(false);
        } else if (!isLoadingMemberships) {
            setJoinedCommunities([]);
            setIsLoadingJoinedCommunities(false);
        }
    }, [memberships, isLoadingMemberships]);

    // Query for created communities
    const createdCommunitiesQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'communities'),
            where('creatorId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
    }, [user, firestore]);

    const { data: createdCommunities, isLoading: isLoadingCreatedCommunities } = useCollection<Community>(createdCommunitiesQuery);

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold font-heading">
                        <span className="text-gradient">{t('myCommunities')}</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {t('myCommunitiesPageDescription') || "Zarządzaj społecznościami, do których dołączyłeś lub które utworzyłeś"}
                    </p>
                </div>
                <CreateCommunityDialog>
                    <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('createNewCommunity')}
                    </Button>
                </CreateCommunityDialog>
            </div>

            <Tabs defaultValue="joined" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="joined">
                        {t('joinedCommunities')}
                    </TabsTrigger>
                    <TabsTrigger value="created">
                        {t('createdCommunities')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="joined" className="mt-6">
                    {isLoadingJoinedCommunities ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ) : joinedCommunities && joinedCommunities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {joinedCommunities.map((community) => (
                                <Link key={community.id} href={`/community/${community.id}`}>
                                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="h-5 w-5" />
                                                {community.name}
                                            </CardTitle>
                                            {community.description && (
                                                <CardDescription className="line-clamp-2">
                                                    {community.description}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground text-center">
                                    {t('noCommunitiesYet')}
                                </p>
                                <Link href="/explore" className="mt-4">
                                    <Button variant="outline">
                                        {t('explore')}
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="created" className="mt-6">
                    {isLoadingCreatedCommunities ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ) : createdCommunities && createdCommunities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {createdCommunities.map((community) => (
                                <Link key={community.id} href={`/community/${community.id}`}>
                                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="h-5 w-5" />
                                                {community.name}
                                            </CardTitle>
                                            {community.description && (
                                                <CardDescription className="line-clamp-2">
                                                    {community.description}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground text-center mb-2">
                                    {t('noCommunitiesYet')}
                                </p>
                                <CreateCommunityDialog>
                                    <Button variant="outline">
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('createNewCommunity')}
                                    </Button>
                                </CreateCommunityDialog>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
