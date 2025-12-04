'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth'; // Import getAuth and Auth type
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let firebaseApp: FirebaseApp;
let auth: Auth;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length === 0) {
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

  // Get auth instance
  auth = getAuth(firebaseApp);

  // Set persistence only on the client side
  if (typeof window !== 'undefined') {
    const { setPersistence, browserLocalPersistence } = require('firebase/auth');
    setPersistence(auth, browserLocalPersistence).catch((error: any) => {
      console.error('Error setting auth persistence:', error);
    });
  }

  return {
    firebaseApp,
    auth,
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
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
