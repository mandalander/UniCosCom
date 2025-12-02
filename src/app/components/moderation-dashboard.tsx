'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collectionGroup, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { Report } from '@/lib/types';
import { useLanguage } from './language-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Trash2, XCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export function ModerationDashboard() {
    const { t, language } = useLanguage();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!firestore || !user) return;

        // Query all 'reports' collections across all communities
        const q = query(
            collectionGroup(firestore, 'reports'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedReports = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Report[];
            setReports(fetchedReports);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reports:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, user]);

    const handleDismiss = async (report: Report) => {
        if (!firestore) return;
        setProcessingId(report.id);

        try {
            // We need the full path to the report document.
            // Since we used collectionGroup, we can get the ref from the doc, but here we have the data.
            // However, we stored communityId in the report, so we can construct the path.
            const reportRef = doc(firestore, 'communities', report.communityId, 'reports', report.id);

            await updateDoc(reportRef, {
                status: 'dismissed',
                resolvedAt: new Date(),
                resolvedBy: user?.uid
            });

            toast({
                title: t('reportDismissed') || "Report dismissed",
            });
        } catch (error) {
            console.error("Error dismissing report:", error);
            toast({
                variant: "destructive",
                title: t('error'),
                description: "Failed to dismiss report."
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteContent = async (report: Report) => {
        if (!firestore) return;
        setProcessingId(report.id);

        try {
            const batch = writeBatch(firestore);

            // 1. Delete the content (post or comment)
            // Path depends on targetType
            let contentRef;
            if (report.targetType === 'post') {
                contentRef = doc(firestore, 'communities', report.communityId, 'posts', report.targetId);
            } else if (report.targetType === 'comment') {
                if (report.postId) {
                    contentRef = doc(firestore, 'communities', report.communityId, 'posts', report.postId, 'comments', report.targetId);
                } else {
                    console.warn("Cannot delete comment: missing postId in report.");
                    toast({
                        variant: "destructive",
                        title: t('error'),
                        description: "Cannot delete this comment (missing parent post info)."
                    });
                    // We don't return here, we let it resolve the report but not delete content if we can't find it.
                    // Or maybe we should stop? Let's stop to be safe.
                    setProcessingId(null);
                    return;
                }
            }

            if (contentRef) {
                batch.delete(contentRef);
            }

            // 2. Update report status
            const reportRef = doc(firestore, 'communities', report.communityId, 'reports', report.id);
            batch.update(reportRef, {
                status: 'resolved',
                resolution: 'content_deleted',
                resolvedAt: new Date(),
                resolvedBy: user?.uid
            });

            await batch.commit();

            toast({
                title: t('contentDeleted') || "Content deleted",
                description: t('contentDeleted') || "Content deleted and report resolved."
            });

        } catch (error) {
            console.error("Error deleting content:", error);
            toast({
                variant: "destructive",
                title: t('error'),
                description: "Failed to delete content."
            });
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{t('noReports') || "No pending reports."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reports.map((report) => (
                <Card key={report.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant={report.reason === 'spam' ? 'secondary' : 'destructive'}>
                                        {report.reason}
                                    </Badge>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {formatDistanceToNow(report.createdAt?.toDate ? report.createdAt.toDate() : new Date(), { addSuffix: true, locale: language === 'pl' ? pl : enUS })}
                                    </span>
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {t('reportedBy')} {report.reporterDisplayName}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted p-4 rounded-md">
                            <p className="font-medium text-sm mb-1 text-muted-foreground uppercase tracking-wider">
                                {t('reportedContent') || "Reported Content"} ({report.targetType})
                            </p>
                            <p className="italic">"{report.targetContent}"</p>
                        </div>
                        {/* {report.description && (
                            <div>
                                <p className="font-medium text-sm text-muted-foreground">{t('reportDetails')}:</p>
                                <p>{report.description}</p>
                            </div>
                        )} */}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleDismiss(report)}
                            disabled={processingId === report.id}
                        >
                            {processingId === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                            {t('dismiss') || "Dismiss"}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleDeleteContent(report)}
                            disabled={processingId === report.id}
                        >
                            {processingId === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            {t('deleteContent') || "Delete Content"}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
