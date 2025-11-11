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
import Link from 'next/link';
import { useLanguage } from '../components/language-provider';
import { useState } from 'react';
import {
  useAuth,
  initiateEmailSignUp,
  initiateEmailSignIn,
} from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const auth = useAuth();

  const handleAuthAction = () => {
    if (isRegistering) {
      initiateEmailSignUp(auth, email, password);
    } else {
      initiateEmailSignIn(auth, email, password);
    }
  };

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
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
        </CardContent>
      </Card>
    </div>
  );
}
