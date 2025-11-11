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
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profileTitle')}</CardTitle>
        <CardDescription>{t('profileDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isUserLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
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
          </div>
        ) : (
          <p>{t('profileNotLoggedIn')}</p>
        )}
      </CardContent>
      <CardFooter>
        {user && !isUserLoading && (
            <Button asChild>
                <Link href="/profile/edit">{t('editProfile')}</Link>
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
