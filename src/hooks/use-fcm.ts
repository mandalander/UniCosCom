'use client';

import { useState, useEffect } from 'react';
import { useFirebase, useUser, useFirestore } from '@/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const VAPID_KEY = 'BAzunhyJlq36XfRxM_HT562LV-X0Wz5XrInv89AfnpwQ-7NE_gr-YTJ5IWHUUUuE3aUNYqRKuDjL0zPQ4BYAKRI';

export function useFcm() {
    const { messaging } = useFirebase();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    useEffect(() => {
        if (messaging && typeof window !== 'undefined') {
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('FCM Message received:', payload);
                if (payload.notification) {
                    toast({
                        title: payload.notification.title,
                        description: payload.notification.body,
                    });
                }
            });
            return () => unsubscribe();
        }
    }, [messaging, toast]);

    const requestPermission = async () => {
        if (!messaging || !user || !firestore) {
            console.warn('FCM: Messaging or User not ready');
            return;
        }

        setIsLoading(true);
        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult === 'granted') {
                const token = await getToken(messaging, { vapidKey: VAPID_KEY });
                if (token) {
                    setFcmToken(token);
                    console.log('FCM Token:', token);

                    // Save token to user profile
                    const userRef = doc(firestore, 'userProfiles', user.uid);
                    await setDoc(userRef, {
                        fcmTokens: arrayUnion(token),
                        pushNotificationsEnabled: true
                    }, { merge: true });

                    toast({
                        title: "Powiadomienia włączone",
                        description: "Będziesz otrzymywać powiadomienia o nowych interakcjach.",
                    });
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Powiadomienia zablokowane",
                    description: "Musisz zezwolić na powiadomienia w ustawieniach przeglądarki.",
                });
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            toast({
                variant: "destructive",
                title: "Błąd",
                description: "Nie udało się włączyć powiadomień.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        permission,
        fcmToken,
        requestPermission,
        isLoading
    };
}
