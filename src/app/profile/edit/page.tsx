'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/app/components/language-provider';
import { useToast } from '@/hooks/use-toast';

export default function EditProfilePage() {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile(user, { displayName });
      toast({
        title: t('editProfileSuccessTitle'),
        description: t('editProfileSuccessDescription'),
      });
      router.push('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: t('editProfileErrorTitle'),
        description: t('editProfileErrorDescription'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading) {
    return <div>{t('profileLoading')}</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('editProfileTitle')}</CardTitle>
        <CardDescription>{t('editProfileDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">{t('profileDisplayName')}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('editProfileDisplayNamePlaceholder')}
              disabled={isSaving}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t('editProfileSaving') : t('editProfileSave')}
        </Button>
      </CardFooter>
    </Card>
  );
}
