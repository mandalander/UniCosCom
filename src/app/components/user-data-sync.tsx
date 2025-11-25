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
      const userProfileDocRef = doc(firestore, 'userProfiles', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      const isNewUser = !userDocSnap.exists();
      const signInProvider = user.providerData?.[0]?.providerId;
      
      // Sync on first-time sign-in or when displayName changes
      if (isNewUser || user.displayName !== userDocSnap.data()?.displayName || user.photoURL !== userDocSnap.data()?.photoURL) {
         try {
           const userData: any = {
             uid: user.uid,
             email: user.email,
             displayName: user.displayName,
             photoURL: user.photoURL,
             updatedAt: serverTimestamp(),
           };
           
           const userProfileData: any = {
              displayName: user.displayName,
              photoURL: user.photoURL,
              updatedAt: serverTimestamp(),
           };

           if(isNewUser){
              userData.createdAt = serverTimestamp();
              const nameParts = user.displayName?.split(' ') || [];
              userData.firstName = nameParts[0] || '';
              userData.lastName = nameParts.slice(1).join(' ') || '';
              
              userProfileData.createdAt = serverTimestamp();
           }

           await setDoc(userDocRef, userData, { merge: true });
           await setDoc(userProfileDocRef, userProfileData, { merge: true });

        } catch (error) {
          console.error("Error syncing user data:", error);
        }
      }
    };

    syncUserData();

  }, [user, firestore]);

  return null; // This component doesn't render anything
}
