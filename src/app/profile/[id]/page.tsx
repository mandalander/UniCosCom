'use client';

import { useParams } from 'next/navigation';
import {
  useFirestore,
  useDoc,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/app/components/language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { PostFeed } from '@/app/components/post-feed';

type UserProfile = {
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: any;
};

export default function UserProfilePage() {
  const { id: userId } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const getInitials = (name?: string | null) => {
    return name ? name.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5" />;
  };

  const formatCreationDate = (timestamp: any) => {
    if (!timestamp) return t('profileNotSet');
    try {
      const date = timestamp.toDate();
      return format(date, 'P', { locale: language === 'pl' ? pl : enUS });
    } catch (e) {
      return t('profileNotSet');
    }
  };

  const displayName = userProfile?.displayName || t('profileNoDisplayName');

  if (isProfileLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <div>{t('userNotFound')}</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userProfile.photoURL} alt={displayName} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{displayName}</CardTitle>
              <CardDescription>
                {t('profileJoinedDate')}: {formatCreationDate(userProfile.createdAt)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {t('userPosts', { username: displayName })}
        </h2>
        <PostFeed userId={userId} />
      </div>
    </div>
  );
}
