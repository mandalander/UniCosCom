'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  AuthProvider,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(error => {
    console.error("Anonymous sign-in error:", error);
    // Optionally, you can re-throw the error or handle it in a specific way
    // For now, we log it, as auth state changes are handled globally.
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  return createUserWithEmailAndPassword(authInstance, email, password)
    .then(() => {}) // Resolve to void on success
    .catch(error => {
      console.error("Email sign-up error:", error);
      throw error; // Re-throw to be caught by the caller
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  return signInWithEmailAndPassword(authInstance, email, password)
    .then(() => {}) // Resolve to void on success
    .catch(error => {
      console.error("Email sign-in error:", error);
      throw error; // Re-throw to be caught by the caller
    });
}

/** Initiate sign-in with a provider (e.g., Google) via a popup (non-blocking). */
export function initiateSignInWithProvider(authInstance: Auth, provider: AuthProvider): void {
  signInWithPopup(authInstance, provider).catch(error => {
    console.error("Provider sign-in error:", error);
    // The user might have closed the popup, which can be an error.
    // We log it but don't re-throw to avoid unhandled promise rejections
    // if the caller doesn't attach a .catch().
  });
}
