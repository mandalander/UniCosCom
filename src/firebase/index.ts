'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth'; // Import TYPES only
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  // Only initialize auth on the client side to avoid localStorage issues during SSR
  let auth: Auth | null = null;

  if (typeof window !== 'undefined') {
    // Dynamically import firebase/auth to avoid SSR side effects
    // We use require here because this function is synchronous and we want to avoid top-level imports
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAuth, setPersistence, inMemoryPersistence } = require('firebase/auth');

    auth = getAuth(firebaseApp);
    // Set persistence to inMemoryPersistence to prevent automatic localStorage access
    setPersistence(auth, inMemoryPersistence).catch((error: any) => {
      console.error('Error setting auth persistence:', error);
    });
  }

  return {
    firebaseApp,
    auth: auth as any, // Type assertion since we know it will be initialized on client
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
export { useUser } from './provider';
