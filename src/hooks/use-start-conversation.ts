import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface StartConversationParams {
    targetUserId: string;
    targetUserDisplayName: string;
    targetUserPhotoURL?: string | null;
}

export function useStartConversation() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [isStarting, setIsStarting] = useState(false);

    const startConversation = async ({ targetUserId, targetUserDisplayName, targetUserPhotoURL }: StartConversationParams) => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!firestore || !targetUserId) return;

        setIsStarting(true);
        try {
            const participantIds = [user.uid, targetUserId].sort();
            const conversationId = participantIds.join('_');
            const conversationRef = doc(firestore, 'conversations', conversationId);

            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                await setDoc(conversationRef, {
                    participants: participantIds,
                    participantDetails: {
                        [user.uid]: {
                            displayName: user.displayName || 'User',
                            photoURL: user.photoURL || null,
                        },
                        [targetUserId]: {
                            displayName: targetUserDisplayName,
                            photoURL: targetUserPhotoURL || null,
                        }
                    },
                    createdAt: serverTimestamp(),
                    lastMessage: '',
                    lastMessageAt: serverTimestamp(),
                    unreadCounts: {
                        [user.uid]: 0,
                        [targetUserId]: 0
                    }
                });
            }

            router.push('/messages');
        } catch (error) {
            console.error("Error starting conversation:", error);
        } finally {
            setIsStarting(false);
        }
    };

    return { startConversation, isStarting };
}
