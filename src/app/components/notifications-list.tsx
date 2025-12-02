'use client';

import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/app/components/language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Heart, MessageSquare, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { Notification } from '@/lib/types';

export function NotificationsList() {
    const { t, language } = useLanguage();
    const firestore = useFirestore();
    const { user } = useUser();

    const notificationsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'userProfiles', user.uid, 'notifications'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate();
            return formatDistanceToNow(date, { addSuffix: true, locale: language === 'pl' ? pl : enUS });
        } catch (e) {
            return '';
        }
    };

    const getInitials = (name?: string | null) => {
        return name ? name.charAt(0).toUpperCase() : <User className="h-5 w-5" />;
    };

    const markAsRead = async (notificationId: string) => {
        if (!firestore || !user) return;
        const notificationRef = doc(firestore, 'userProfiles', user.uid, 'notifications', notificationId);
        try {
            await updateDoc(notificationRef, { read: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!firestore || !user || !notifications) return;

        const unreadNotifications = notifications.filter(n => !n.read);
        if (unreadNotifications.length === 0) return;

        const batch = writeBatch(firestore);
        unreadNotifications.forEach(n => {
            const ref = doc(firestore, 'userProfiles', user.uid, 'notifications', n.id);
            batch.update(ref, { read: true });
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!notifications || notifications.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>{t('noNotifications') || "Brak powiadomień"}</p>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-4">
            {unreadCount > 0 && (
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={markAllAsRead} className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        {t('markAllAsRead') || "Oznacz wszystkie jako przeczytane"}
                    </Button>
                </div>
            )}

            {notifications.map((notification) => (
                <Card
                    key={notification.id}
                    className={cn(
                        "transition-colors",
                        !notification.read ? "bg-muted/40 border-l-4 border-l-primary" : "opacity-80"
                    )}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                >
                    <CardContent className="p-4 flex gap-4 items-start">
                        <div className="mt-1">
                            {notification.type === 'vote' ? (
                                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full text-red-500">
                                    <Heart size={16} className="fill-current" />
                                </div>
                            ) : (
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-500">
                                    <MessageSquare size={16} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-1">
                            <p className="text-sm">
                                <span className="font-semibold">{notification.actorDisplayName}</span>
                                {' '}
                                {notification.type === 'vote' ? (
                                    <span>{t('notificationVoted') || "zagłosował(a) na Twój"}</span>
                                ) : (
                                    <span>{t('notificationCommented') || "skomentował(a) Twój"}</span>
                                )}
                                {' '}
                                {notification.targetType === 'post' ? (
                                    <span>{t('post') || "post"}</span>
                                ) : (
                                    <span>{t('comment') || "komentarz"}</span>
                                )}
                                {notification.targetTitle && (
                                    <span className="font-medium text-muted-foreground">: "{notification.targetTitle}"</span>
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatDate(notification.createdAt)}
                            </p>

                            <div className="pt-2">
                                <Link
                                    href={`/community/${notification.communityId}/post/${notification.postId}`}
                                    className="text-sm text-primary hover:underline"
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    {t('viewContext') || "Zobacz"}
                                </Link>
                            </div>
                        </div>

                        {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary mt-2" title="Nieprzeczytane" />
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
