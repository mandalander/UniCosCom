'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, where, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Report, Community } from '@/lib/types';
import { useLanguage } from '@/app/components/language-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Trash2, ExternalLink, Ban, UserX } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

export default function ModerationPage() {
    const { id } = useParams();
    const communityId = id as string;
    const { user, isUserLoading: userLoading } = useUser();
    const firestore = useFirestore();
    const { t } = useLanguage();
    const { toast } = useToast();
    const router = useRouter();

    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreator, setIsCreator] = useState(false);
    const [community, setCommunity] = useState<Community | null>(null);
    const [bannedUsers, setBannedUsers] = useState<any[]>([]);

    useEffect(() => {
        if (userLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        if (!firestore) return;

        const checkCreator = async () => {
            const communityRef = doc(firestore, 'communities', communityId);
            const communitySnap = await getDoc(communityRef);
            if (communitySnap.exists() && communitySnap.data().creatorId === user.uid) {
                setIsCreator(true);
                setCommunity({ id: communitySnap.id, ...communitySnap.data() } as Community);
            } else {
                router.push(`/community/${communityId}`);
            }
        };

        checkCreator();
    }, [user, userLoading, firestore, communityId, router]);

    useEffect(() => {
        if (!firestore || !isCreator) return;

        const reportsRef = collection(firestore, 'communities', communityId, 'reports');
        const q = query(reportsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reportsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Report[];
            setReports(reportsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, communityId, isCreator]);

    useEffect(() => {
        if (!firestore || !community?.bannedUserIds || community.bannedUserIds.length === 0) {
            setBannedUsers([]);
            return;
        }

        const fetchBannedUsers = async () => {
            const usersData = await Promise.all(
                community.bannedUserIds!.map(async (uid) => {
                    const userRef = doc(firestore, 'userProfiles', uid);
                    const userSnap = await getDoc(userRef);
                    return userSnap.exists() ? { uid, ...userSnap.data() } : null;
                })
            );
            setBannedUsers(usersData.filter(Boolean));
        };

        fetchBannedUsers();
    }, [firestore, community]);

    const handleDismiss = async (reportId: string) => {
        if (!firestore || !user) return;
        try {
            const reportRef = doc(firestore, 'communities', communityId, 'reports', reportId);
            await updateDoc(reportRef, {
                status: 'dismissed',
                resolvedBy: user.uid,
            });
            toast({ description: t('reportDismissed') || "Report dismissed." });
        } catch (error) {
            console.error("Error dismissing report:", error);
            toast({ variant: "destructive", description: t('error') });
        }
    };

    const handleDeleteContent = async (report: Report) => {
        if (!firestore || !user) return;
        try {
            if (report.targetType === 'post') {
                await deleteDocumentNonBlocking(doc(firestore, 'communities', communityId, 'posts', report.targetId));
            } else if (report.targetType === 'comment' && report.postId) {
                await deleteDocumentNonBlocking(doc(firestore, 'communities', communityId, 'posts', report.postId, 'comments', report.targetId));
            }

            const reportRef = doc(firestore, 'communities', communityId, 'reports', report.id);
            await updateDoc(reportRef, {
                status: 'resolved',
                resolution: 'content_deleted',
                resolvedBy: user.uid,
            });

            toast({ description: t('contentDeleted') || "Content deleted and report resolved." });
        } catch (error) {
            console.error("Error deleting content:", error);
            toast({ variant: "destructive", description: t('error') });
        }
    };

    const handleBanUser = async (report: Report, reportedUserId: string) => {
        if (!firestore || !user) return;
        try {
            const communityRef = doc(firestore, 'communities', communityId);
            await updateDoc(communityRef, {
                bannedUserIds: arrayUnion(reportedUserId),
            });

            toast({ description: t('userBanned') || "User banned." });
        } catch (error) {
            console.error("Error banning user:", error);
            toast({ variant: "destructive", description: t('error') });
        }
    };

    const handleUnbanUser = async (userId: string) => {
        if (!firestore) return;
        try {
            const communityRef = doc(firestore, 'communities', communityId);
            await updateDoc(communityRef, {
                bannedUserIds: arrayRemove(userId),
            });

            toast({ description: t('userUnbanned') || "User unbanned." });
        } catch (error) {
            console.error("Error unbanning user:", error);
            toast({ variant: "destructive", description: t('error') });
        }
    };

    if (userLoading || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!isCreator) return null;

    const pendingReports = reports.filter(r => r.status === 'pending');
    const resolvedReports = reports.filter(r => r.status !== 'pending');

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{t('moderationDashboard') || "Moderation Dashboard"}</h1>
                <Button variant="outline" asChild>
                    <Link href={`/community/${communityId}`}>{t('backToCommunity') || "Back to Community"}</Link>
                </Button>
            </div>

            <Tabs defaultValue="pending">
                <TabsList className="mb-4">
                    <TabsTrigger value="pending">{t('pendingReports') || "Pending"} ({pendingReports.length})</TabsTrigger>
                    <TabsTrigger value="resolved">{t('resolvedReports') || "Resolved"} ({resolvedReports.length})</TabsTrigger>
                    <TabsTrigger value="banned">{t('bannedUsers') || "Banned Users"} ({bannedUsers.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                    {pendingReports.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {t('noReports') || "No pending reports."}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {pendingReports.map((report) => (
                                <Card key={report.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Badge variant={report.targetType === 'post' ? 'default' : 'secondary'}>
                                                        {report.targetType === 'post' ? t('post') : t('comment')}
                                                    </Badge>
                                                    <span>{t('reportedBy') || "Reported by"} {report.reporterDisplayName}</span>
                                                </CardTitle>
                                                <CardDescription>
                                                    {t('reason') || "Reason"}: <span className="font-semibold">{report.reason}</span>
                                                </CardDescription>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {report.createdAt?.toDate().toLocaleDateString()}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-muted p-3 rounded-md text-sm">
                                            {report.targetContent}
                                        </div>
                                        {report.targetType === 'post' && (
                                            <div className="mt-2">
                                                <Link href={`/community/${communityId}/post/${report.targetId}`} className="text-blue-500 hover:underline text-sm flex items-center gap-1">
                                                    <ExternalLink className="h-3 w-3" /> {t('viewContext')}
                                                </Link>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 flex-wrap">
                                        <Button variant="outline" size="sm" onClick={() => handleDismiss(report.id)}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            {t('dismiss') || "Dismiss"}
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteContent(report)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('deleteContent') || "Delete Content"}
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleBanUser(report, report.reporterId)}>
                                            <Ban className="mr-2 h-4 w-4" />
                                            {t('banReporter') || "Ban Reporter"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="resolved">
                    {resolvedReports.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {t('noResolvedReports') || "No resolved reports."}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {resolvedReports.map((report) => (
                                <Card key={report.id} className="opacity-70">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Badge variant={report.status === 'resolved' ? 'default' : 'secondary'}>
                                                        {report.status}
                                                    </Badge>
                                                    <span className="text-sm">{report.reason}</span>
                                                </CardTitle>
                                                <CardDescription>
                                                    {t('reportedBy') || "Reported by"} {report.reporterDisplayName}
                                                    {report.resolution && ` • ${report.resolution}`}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-muted p-3 rounded-md text-sm">
                                            {report.targetContent}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="banned">
                    {bannedUsers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {t('noBannedUsers') || "No banned users."}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {bannedUsers.map((user: any) => (
                                <Card key={user.uid}>
                                    <CardContent className="flex items-center justify-between p-6">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={user.photoURL} />
                                                <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-lg">{user.displayName}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleUnbanUser(user.uid)}>
                                            <UserX className="mr-2 h-4 w-4" />
                                            {t('unban') || "Unban"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
