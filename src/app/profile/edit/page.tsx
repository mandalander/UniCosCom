'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function EditProfilePage() {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
    if (userProfile) {
      setGender(userProfile.gender || '');
      if (userProfile.birthDate) {
        setBirthDate(new Date(userProfile.birthDate));
      }
    }
  }, [user, userProfile]);

  const handleSave = async () => {
    if (!user || !firestore) return;

    setIsSaving(true);
    try {
      if (user.displayName !== displayName) {
        await updateProfile(user, { displayName });
      }

      const userDocRef = doc(firestore, 'users', user.uid);
      const profileData = {
        gender,
        birthDate: birthDate ? birthDate.toISOString().split('T')[0] : null,
      };
      
      setDocumentNonBlocking(userDocRef, profileData, { merge: true });

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

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
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
        <div className="grid gap-6">
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

          <div className="grid gap-2">
            <Label>{t('gender')}</Label>
            <RadioGroup
              value={gender}
              onValueChange={setGender}
              className="flex gap-4"
              disabled={isSaving}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">{t('genderMale')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">{t('genderFemale')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">{t('genderOther')}</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="birthDate">{t('profileBirthDate')}</Label>
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground"
                    )}
                    disabled={isSaving}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "PPP") : <span>{t('editProfileBirthDatePlaceholder')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
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
