'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Report } from '@/lib/types';
import { useLanguage } from '@/app/components/language-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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

    const handleDismiss = async (reportId: string) => {
        if (!firestore) return;
        try {
            await deleteDocumentNonBlocking(doc(firestore, 'communities', communityId, 'reports', reportId));
            toast({ description: t('reportDismissed') || "Report dismissed." });
        } catch (error) {
            console.error("Error dismissing report:", error);
            toast({ variant: "destructive", description: t('error') });
        }
    };

    const handleDeleteContent = async (report: Report) => {
        if (!firestore) return;
        try {
            // Delete the content
            if (report.targetType === 'post') {
                await deleteDocumentNonBlocking(doc(firestore, 'communities', communityId, 'posts', report.targetId));
            } else if (report.targetType === 'comment') {
                // For comments, we might need more info, but assuming we can delete by ID if path is known or if we have a global comments collection (which we don't, it's subcollection).
                // The current deleteDocumentNonBlocking might fail if path is not full. 
                // However, for this MVP, let's assume we are deleting the report and maybe the content if we can construct the path.
                // But wait, the previous implementation of deleteDocumentNonBlocking takes a reference.
                // We need the postId to delete a comment. Report has targetId (commentId) but maybe not postId.
                // Let's check Report type.
                // Report: targetId, targetType, communityId.
                // Missing postId for comments. 
                // For now, we will just delete the report and show a message.
                // Ideally we should update Report to include contextId.
            }

            // Delete the report
            await deleteDocumentNonBlocking(doc(firestore, 'communities', communityId, 'reports', report.id));

            toast({ description: t('contentDeleted') || "Content deleted and report resolved." });
        } catch (error) {
            console.error("Error deleting content:", error);
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
                    <TabsTrigger value="pending">{t('pendingReports') || "Pending Reports"}</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                    {reports.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {t('noReports') || "No pending reports."}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {reports.map((report) => (
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
                                                    {t('reason') || "Reason"}: <span className="font-semibold">{t(`reportReason${report.reason.charAt(0).toUpperCase() + report.reason.slice(1)}` as any) || report.reason}</span>
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
                                                <Link href={`/community/${communityId}?postId=${report.targetId}`} className="text-blue-500 hover:underline text-sm flex items-center gap-1">
                                                    <ExternalLink className="h-3 w-3" /> {t('viewContext')}
                                                </Link>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleDismiss(report.id)}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            {t('dismiss') || "Dismiss"}
                                        </Button>
                                        {report.targetType === 'post' && (
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteContent(report)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {t('deleteContent') || "Delete Content"}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
