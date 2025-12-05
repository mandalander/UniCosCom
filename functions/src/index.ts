/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

export const sendPushNotification = onDocumentCreated(
    "userProfiles/{userId}/notifications/{notificationId}",
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log("No data associated with the event");
            return;
        }

        const { userId } = event.params;
        const notification = snapshot.data();

        // Get user's FCM tokens
        const userProfileRef = admin.firestore().doc(`userProfiles/${userId}`);
        const userProfileSnap = await userProfileRef.get();

        if (!userProfileSnap.exists) {
            console.log(`User profile ${userId} not found`);
            return;
        }

        const userData = userProfileSnap.data();
        const fcmTokens = userData?.fcmTokens as string[];

        if (!fcmTokens || fcmTokens.length === 0) {
            console.log(`No FCM tokens found for user ${userId}`);
            return;
        }

        // Construct notification payload
        let title = "Nowe powiadomienie";
        let body = "Masz nową wiadomość w UniCosCom";

        // Logic for different notification types
        if (notification.type === 'vote') {
            title = "Ktoś zagłosował na Twój post";
            body = `${notification.actorDisplayName || 'Ktoś'} dał w górę Twój ${notification.targetType === 'comment' ? 'komentarz' : 'post'}.`;
        } else if (notification.type === 'reaction') {
            title = `Nowa reakcja ${notification.reactionType || ''}`;
            body = `${notification.actorDisplayName || 'Ktoś'} zareagował na Twój ${notification.targetType === 'comment' ? 'komentarz' : 'post'}.`;
        } else if (notification.type === 'comment') {
            title = "Nowy komentarz";
            body = `${notification.actorDisplayName || 'Ktoś'} skomentował Twój post: "${notification.targetTitle || ''}"`;
        } else if (notification.type === 'message') {
            title = "Nowa wiadomość";
            body = `${notification.actorDisplayName || 'Ktoś'}: ${notification.targetTitle || 'Wysłał wiadomość'}`; // targetTitle used for message preview
        }

        const message: admin.messaging.MulticastMessage = {
            tokens: fcmTokens,
            notification: {
                title: title,
                body: body,
            },
            webpush: {
                fcmOptions: {
                    link: notification.type === 'message'
                        ? `/messages?conversationId=${notification.targetId}`
                        : `/community/${notification.communityId || ''}/post/${notification.postId || ''}`
                },
                notification: {
                    icon: '/icon.png'
                }
            }
        };

        // Send notifications to all tokens
        const response = await admin.messaging().sendEachForMulticast(message);

        // Cleanup invalid tokens
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(fcmTokens[idx]);
                }
            });

            if (failedTokens.length > 0) {
                await userProfileRef.update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
                });
                console.log(`Removed ${failedTokens.length} invalid tokens`);
            }
        }

        console.log(`Sent ${response.successCount} messages successfully`);
    }
);

export const onNewMessage = onDocumentCreated(
    "conversations/{conversationId}/messages/{messageId}",
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log("No data associated with the event");
            return;
        }

        const { conversationId } = event.params;
        const messageData = snapshot.data();
        const senderId = messageData.senderId;

        // Get conversation details to find participants
        const conversationRef = admin.firestore().doc(`conversations/${conversationId}`);
        const conversationSnap = await conversationRef.get();

        if (!conversationSnap.exists) {
            console.log(`Conversation ${conversationId} not found`);
            return;
        }

        const conversationData = conversationSnap.data();
        const participants = conversationData?.participants as string[];

        if (!participants) {
            console.log("No participants found in conversation");
            return;
        }

        // Identify recipients (everyone except sender)
        const recipients = participants.filter(uid => uid !== senderId);

        // Get sender details for display name
        const senderProfileSnap = await admin.firestore().doc(`userProfiles/${senderId}`).get();
        const senderDisplayName = senderProfileSnap.data()?.displayName || 'Someone';

        const batch = admin.firestore().batch();

        for (const recipientId of recipients) {
            const notificationRef = admin.firestore().collection(`userProfiles/${recipientId}/notifications`).doc();

            batch.set(notificationRef, {
                recipientId: recipientId,
                type: 'message',
                targetType: 'conversation',
                targetId: conversationId,
                targetTitle: messageData.content?.substring(0, 50) || 'Sent a photo',
                actorId: senderId,
                actorDisplayName: senderDisplayName,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        await batch.commit();
        console.log(`Created notifications for ${recipients.length} recipients`);
    }
);
