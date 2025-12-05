'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '../components/language-provider';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/lib/types';

import { PushNotificationsToggle } from '@/app/components/settings/push-notifications-toggle';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user || !firestore) return;
      setLoadingSettings(true);
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          if (data.settings) {
            setEmailNotifications(data.settings.emailNotifications ?? true);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };

    if (mounted && user) {
      fetchSettings();
    }
  }, [user, firestore, mounted]);

  const handleNotificationChange = async (value: boolean) => {
    setEmailNotifications(value);

    if (!user || !firestore) return;

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        settings: {
          emailNotifications: value,
        }
      }, { merge: true });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('errorSavingSettings'),
      });
      setEmailNotifications(!value);
    }
  };

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settingsTitle')}</CardTitle>
          <CardDescription>
            {t('settingsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <Label>{t('theme')}</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
              >
                {t('light')}
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
              >
                {t('dark')}
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
              >
                {t('system')}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('language')}</Label>
            <div className="flex gap-2">
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                onClick={() => setLanguage('en')}
              >
                {t('english')}
              </Button>
              <Button
                variant={language === 'pl' ? 'default' : 'outline'}
                onClick={() => setLanguage('pl')}
              >
                {t('polish')}
              </Button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">{t('notificationsTitle')}</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('emailNotifications')}</Label>
                <p className="text-sm text-muted-foreground">{t('emailNotificationsDescription')}</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={handleNotificationChange}
                disabled={loadingSettings || !user}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <PushNotificationsToggle />
    </div>
  );
}
