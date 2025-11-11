'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function UserDataSync() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    const syncUserData = async () => {
      if (!user || !firestore) return;

      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // Check if this is a first-time sign-in with a provider
      const isNewUser = !userDocSnap.exists();
      const signInProvider = user.providerData?.[0]?.providerId;
      const isGoogleSignIn = signInProvider === 'google.com';

      if (isNewUser && isGoogleSignIn && user.displayName) {
        const nameParts = user.displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        try {
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            firstName: firstName,
            lastName: lastName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error creating user document:", error);
        }
      }
    };

    syncUserData();

  }, [user, firestore]);

  return null; // This component doesn't render anything
}
