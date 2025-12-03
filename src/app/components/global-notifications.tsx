'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './language-provider';
import { Notification } from '@/lib/types';

export function GlobalNotifications() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { t } = useLanguage();
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (!user || !firestore) return;

        // Listen for unread notifications
        const q = query(
            collection(firestore, 'userProfiles', user.uid, 'notifications'),
            where('read', '==', false),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Skip the initial load to avoid spamming toasts for existing unread notifications
            if (isFirstLoad.current) {
                isFirstLoad.current = false;
                return;
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const notification = change.doc.data() as Notification;

                    let title = t('newNotification') || "New Notification";
                    let description = "";

                    if (notification.type === 'vote') {
                        description = `${notification.actorDisplayName} ${t('notificationVoted') || "voted on your"} ${notification.targetType === 'post' ? (t('post') || "post") : (t('comment') || "comment")}`;
                    } else if (notification.type === 'comment') {
                        description = `${notification.actorDisplayName} ${t('notificationCommented') || "commented on your"} ${notification.targetType === 'post' ? (t('post') || "post") : (t('comment') || "comment")}`;
                    }

                    toast({
                        title: title,
                        description: description,
                    });
                }
            });
        });

        return () => unsubscribe();
    }, [user, firestore, toast, t]);

    return null;
}
