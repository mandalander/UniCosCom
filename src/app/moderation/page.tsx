'use client';

import { ModerationDashboard } from '@/app/components/moderation-dashboard';
import { useLanguage } from '@/app/components/language-provider';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ModerationPage() {
    const { t } = useLanguage();
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    if (isUserLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{t('moderationDashboard') || "Moderation Dashboard"}</h1>
                <p className="text-muted-foreground">
                    {t('moderationDescription') || "Manage reported content and keep the community safe."}
                </p>
            </div>

            <ModerationDashboard />
        </div>
    );
}
