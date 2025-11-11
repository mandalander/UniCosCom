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
import { pl, enUS } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const isLoading = isUserLoading || isProfileLoading;

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return <UserIcon className="h-5 w-5" />;
  };

  const formatDate = (dateString: string) => {
    try {
      // Add a time component to avoid timezone issues with new Date()
      return format(new Date(`${dateString}T00:00:00`), 'P', { locale: language === 'pl' ? pl : enUS });
    } catch (e) {
      return dateString;
    }
  };

  // Determine the correct photo URL, prioritizing the fresh data from Auth
  const displayPhotoUrl = user?.photoURL ?? userProfile?.photoURL;
  const displayDisplayName = user?.displayName || userProfile?.displayName || t('profileNoDisplayName');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profileTitle')}</CardTitle>
        <CardDescription>{t('profileDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
            <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-[300px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[180px]" />
            </div>
          </div>
        ) : user ? (
            <div className="space-y-4">
                <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={displayPhotoUrl ?? undefined} alt={displayDisplayName} />
                        <AvatarFallback>{getInitials(displayDisplayName, user.email)}</AvatarFallback>
                    </Avatar>
                    <div className='space-y-1'>
                        <p className="text-xl font-semibold">
                            {displayDisplayName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <p>
                    <strong>{t('profileId')}:</strong> {user.uid}
                    </p>
                    <p>
                    <strong>{t('profileGender')}:</strong> {userProfile?.gender ? t(`gender${userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)}` as any) : t('profileNotSet')}
                    </p>
                    <p>
                    <strong>{t('profileBirthDate')}:</strong> {userProfile?.birthDate ? formatDate(userProfile.birthDate) : t('profileNotSet')}
                    </p>
                </div>
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
