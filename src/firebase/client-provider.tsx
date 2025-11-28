'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<any | null>(null);
  const [FirebaseProvider, setFirebaseProvider] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  // First effect: mark as mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Second effect: initialize Firebase and load provider only after mounted
  useEffect(() => {
    if (mounted) {
      // Use dynamic imports to ensure Firebase is only loaded on client
      Promise.all([
        import('@/firebase'),
        import('@/firebase/provider')
      ]).then(([firebaseModule, providerModule]) => {
        const services = firebaseModule.initializeFirebase();
        setFirebaseServices(services);
        setFirebaseProvider(() => providerModule.FirebaseProvider);
      }).catch((error) => {
        console.error('Error loading Firebase:', error);
      });
    }
  }, [mounted]);

  // Don't render Firebase provider until we're mounted and services are ready
  if (!mounted || !firebaseServices || !FirebaseProvider) {
    // Return children without Firebase context during SSR and initial client render
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
