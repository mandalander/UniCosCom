'use client';

import { useLanguage } from '@/app/components/language-provider';
import { NotificationsList } from '@/app/components/notifications-list';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function NotificationsPage() {
    const { t } = useLanguage();
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    if (isUserLoading) {
        return <div>{t('loading') || "Ładowanie..."}</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{t('notificationsTitle') || "Powiadomienia"}</h1>
                <p className="text-muted-foreground">{t('notificationsDescription') || "Zobacz kto wchodził w interakcję z Twoimi treściami."}</p>
            </div>

            <NotificationsList />
        </div>
    );
}
