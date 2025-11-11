'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLanguage } from '../components/language-provider';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const isLoading = isUserLoading || isProfileLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profileTitle')}</CardTitle>
        <CardDescription>{t('profileDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[180px]" />
          </div>
        ) : user ? (
          <div className="space-y-2">
            <p>
              <strong>{t('profileDisplayName')}:</strong> {user.displayName || t('profileNoDisplayName')}
            </p>
            <p>
              <strong>{t('profileEmail')}:</strong> {user.email}
            </p>
            <p>
              <strong>{t('profileId')}:</strong> {user.uid}
            </p>
            <p>
              <strong>{t('profileGender')}:</strong> {userProfile?.gender ? t(`gender${userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)}` as any) : t('profileNotSet')}
            </p>
             <p>
              <strong>{t('profileBirthDate')}:</strong> {userProfile?.birthDate ? format(new Date(userProfile.birthDate), 'P') : t('profileNotSet')}
            </p>
          </div>
        ) : (
          <p>{t('profileNotLoggedIn')}</p>
        )}
      </CardContent>
      <CardFooter>
        {user && !isLoading && (
            <Button asChild>
                <Link href="/profile/edit">{t('editProfile')}</Link>
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
