'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * A client-side component that listens for Firestore permission errors
 * and displays a toast notification.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error("Firestore Permission Error handled by Listener:", error);

      toast({
        variant: "destructive",
        title: "Błąd uprawnień / Permission Error",
        description: `Nie udało się zapisać głosu. Sprawdź, czy jesteś zalogowany. (${error.message})`,
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  // This component does not render anything in the UI.
  return null;
}
