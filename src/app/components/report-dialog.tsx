'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from './language-provider';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface ReportDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    targetId: string;
    targetType: 'post' | 'comment';
    targetContent: string;
    communityId: string;
    postId?: string; // Optional, for comments
}

export function ReportDialog({
    isOpen,
    onOpenChange,
    targetId,
    targetType,
    targetContent,
    communityId,
    postId,
}: ReportDialogProps) {
    const { t } = useLanguage();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [reason, setReason] = useState('spam');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!user || !firestore) return;

        setIsSubmitting(true);
        try {
            const reportData = {
                reporterId: user.uid,
                reporterDisplayName: user.displayName || 'Anonymous',
                targetId,
                targetType,
                targetContent: targetContent.substring(0, 200), // Store a preview
                communityId,
                reason,
                description, // Optional additional details
                status: 'pending',
                createdAt: serverTimestamp(),
                ...(postId ? { postId } : {})
            };

            await addDoc(collection(firestore, 'communities', communityId, 'reports'), reportData);

            toast({
                title: t('reportSubmittedTitle'),
                description: t('reportSubmittedDescription'),
            });
            onOpenChange(false);
            setDescription('');
            setReason('spam');
        } catch (error) {
            console.error("Error submitting report:", error);
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('reportError'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('reportContent')}</DialogTitle>
                    <DialogDescription>
                        {t('reportDescription')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <RadioGroup value={reason} onValueChange={setReason} className="grid gap-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="spam" id="spam" />
                            <Label htmlFor="spam">{t('reportReasonSpam')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="harassment" id="harassment" />
                            <Label htmlFor="harassment">{t('reportReasonHarassment')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="misinformation" id="misinformation" />
                            <Label htmlFor="misinformation">{t('reportReasonMisinformation')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <Label htmlFor="other">{t('reportReasonOther')}</Label>
                        </div>
                    </RadioGroup>
                    <div className="grid gap-2">
                        <Label htmlFor="description">{t('reportDetails')}</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('reportDetailsPlaceholder')}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? t('submitting') : t('submitReport')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
