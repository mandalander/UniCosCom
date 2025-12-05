'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth'; // Import getAuth and Auth type
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let firebaseApp: FirebaseApp;
let auth: Auth;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    const apps = getApps();
    if (apps.length === 0) {
      try {
        // Attempt to initialize via Firebase App Hosting environment variables
        firebaseApp = initializeApp();
      } catch (e) {
        if (process.env.NODE_ENV === "production") {
          console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
        }
        firebaseApp = initializeApp(firebaseConfig);
      }
    } else {
      firebaseApp = getApp();
    }
  } else {
    // On the server, we might not need a fully initialized app, 
    // or we might handle it differently.
    // For now, let's just make sure we don't crash.
    const apps = getApps();
    firebaseApp = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  // Get auth instance
  auth = getAuth(firebaseApp);

  // Set persistence only on the client side
  if (typeof window !== 'undefined') {
    const { setPersistence, browserLocalPersistence } = require('firebase/auth');
    setPersistence(auth, browserLocalPersistence).catch((error: any) => {
      console.error('Error setting auth persistence:', error);
    });
  }

  let messaging = null;

  if (typeof window !== 'undefined') {
    // Dynamically import messaging to avoid SSR issues
    const { getMessaging, isSupported } = require('firebase/messaging');
    // Check if supported (e.g. Service Worker support)
    isSupported().then((supported: boolean) => {
      if (supported) {
        messaging = getMessaging(firebaseApp);
      }
    }).catch(console.error);
  }

  return {
    firebaseApp,
    auth,
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
    messaging
  };
}


export * from './provider';
//export * from './client-provider'; // Don't export this to avoid SSR issues
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

// Re-export useUser
export { useUser, useMemoFirebase } from './provider';
