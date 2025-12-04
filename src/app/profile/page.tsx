
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
import { useUser, useDoc, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Link as LinkIcon, Twitter, Linkedin, Github } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useMemo } from 'react';

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
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

  const formatCreationDate = (dateString?: string) => {
    if (!dateString) return t('profileNotSet');
    try {
      return format(new Date(dateString), 'P', { locale: language === 'pl' ? pl : enUS });
    } catch (e) {
      return dateString;
    }
  }

  const displayPhotoUrl = userProfile?.photoURL ?? user?.photoURL;

  const displayFirstName = userProfile?.firstName;
  const displayLastName = userProfile?.lastName;
  const displayFullName = [displayFirstName, displayLastName].filter(Boolean).join(' ');
  const displayName = userProfile?.displayName || user?.displayName || displayFullName || t('profileNoDisplayName');

  return (
    <div className="relative">
      {/* Gradient Banner */}
      <div className="h-48 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 rounded-t-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full blur-2xl" />
      </div>

      <Card className="glass-card border-none -mt-12 mx-4 relative z-10">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 mb-6">
                <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
                <div className="space-y-2 text-center md:text-left mb-2">
                  <Skeleton className="h-8 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-[300px]" />
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ) : user ? (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20 relative z-20">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={displayPhotoUrl ?? undefined} alt={displayName} />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                    {getInitials(displayName, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-1 text-center md:text-left mb-2'>
                  <h1 className="text-3xl font-bold font-heading">{displayName}</h1>
                  <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                    {user.email}
                  </p>
                </div>
                <div className="md:ml-auto mb-2">
                  <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:scale-105">
                    <Link href="/profile/edit">{t('editProfile')}</Link>
                  </Button>
                </div>
              </div>

              {userProfile?.bio && (
                <div className="bg-muted/30 p-4 rounded-lg backdrop-blur-sm border border-white/5">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full" />
                    {t('profileBio')}
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{userProfile.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">{t('profileDetails')}</h3>
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileFirstName')}</span>
                      <span className="font-medium">{displayFirstName || t('profileNotSet')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileLastName')}</span>
                      <span className="font-medium">{displayLastName || t('profileNotSet')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileDisplayName')}</span>
                      <span className="font-medium">{userProfile?.displayName || t('profileNotSet')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileGender')}</span>
                      <span className="font-medium">{userProfile?.gender ? t(`gender${userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)}` as any) : t('profileNotSet')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">{t('profileInfo')}</h3>
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileBirthDate')}</span>
                      <span className="font-medium">{userProfile?.birthDate ? formatDate(userProfile.birthDate) : t('profileNotSet')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileLocation')}</span>
                      <span className="font-medium">{userProfile?.location || t('profileNotSet')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground">{t('profileJoinedDate')}</span>
                      <span className="font-medium">{formatCreationDate(user.metadata.creationTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {(userProfile?.website || userProfile?.twitter || userProfile?.linkedin || userProfile?.github) && (
                <div className="pt-4 border-t">
                  <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
                    {userProfile?.website && (
                      <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all duration-300">
                        <LinkIcon size={16} />
                        <span>{t('profileWebsite')}</span>
                      </a>
                    )}
                    {userProfile?.twitter && (
                      <a href={userProfile.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] transition-all duration-300">
                        <Twitter size={16} />
                        <span>{t('profileTwitter')}</span>
                      </a>
                    )}
                    {userProfile?.linkedin && (
                      <a href={userProfile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] transition-all duration-300">
                        <Linkedin size={16} />
                        <span>{t('profileLinkedIn')}</span>
                      </a>
                    )}
                    {userProfile?.github && (
                      <a href={userProfile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-[#333]/10 hover:text-[#333] dark:hover:text-white transition-all duration-300">
                        <Github size={16} />
                        <span>{t('profileGitHub')}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t('profileNotLoggedIn')}</p>
              <Button asChild>
                <Link href="/login">{t('login')}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
}
