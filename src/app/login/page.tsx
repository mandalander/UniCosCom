'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '../components/language-provider';
import { useState } from 'react';
import {
  useAuth,
  initiateEmailSignUp,
  initiateEmailSignIn,
  initiateSignInWithProvider,
} from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const router = useRouter();

  const handleAuthAction = async () => {
    setError(null);
    try {
      if (isRegistering) {
        await initiateEmailSignUp(auth, email, password);
      } else {
        await initiateEmailSignIn(auth, email, password);
      }
      // Note: Email auth functions in non-blocking-login.tsx are currently void/non-blocking.
      // If we want to await them, we'd need to change them or use the raw firebase functions here too.
      // For now, let's assume the user wants to fix Google Login specifically as requested.
      // But to be consistent, we should probably just let the auth state listener handle the redirect in a real app.
      // However, to match the existing pattern but fix the race condition:
      router.push('/');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (e: any) {
      console.error("Google Sign-In Error:", e);
      setError(e.message || "Failed to sign in with Google.");
    }
  };

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isRegistering ? t('register') : t('loginTitle')}
          </CardTitle>
          <CardDescription>
            {isRegistering
              ? t('registerDescription')
              : t('loginDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t('passwordLabel')}</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleAuthAction} className="w-full">
            {isRegistering ? t('register') : t('login')}
          </Button>
          <Button variant="outline" onClick={handleGoogleSignIn} className="w-full">
            {isRegistering ? t('signUpWithGoogle') : t('signInWithGoogle')}
          </Button>
          <div className="mt-4 text-center text-sm">
            {isRegistering ? t('alreadyHaveAccount') : t('noAccount')}{' '}
            <Button
              variant="link"
              onClick={() => setIsRegistering(!isRegistering)}
              className="p-0"
            >
              {isRegistering ? t('login') : t('register')}
            </Button>
          </div>
          {error && (
            <div className="mt-4 text-center text-sm text-red-500">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
