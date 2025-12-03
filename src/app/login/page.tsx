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
import { GoogleAuthProvider } from 'firebase/auth';
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
      router.push('/');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    initiateSignInWithProvider(auth, provider);
    // The onAuthStateChanged listener will handle the redirect.
    // No need for router.push('/') here to avoid race conditions.
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
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
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
        </CardContent>
      </Card>
    </div>
  );
}
