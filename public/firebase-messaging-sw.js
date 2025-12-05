/* eslint-disable no-undef */
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyCpGS6y5NAPFOuwz4Aos1c0mRdB4yAWMeg",
    authDomain: "studio-1081495655-97074.firebaseapp.com",
    databaseURL: "https://studio-1081495655-97074-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "studio-1081495655-97074",
    storageBucket: "studio-1081495655-97074.firebasestorage.app",
    messagingSenderId: "1066283365530",
    appId: "1:1066283365530:web:b42c71db0e5f37cc759b23",
    measurementId: "G-4MZM0THMX2"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.png' // Customize icon if needed
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
