'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
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
import { CalendarIcon, User as UserIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function EditProfilePage() {
  const { t, language } = useLanguage();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || null);
    }
    if (userProfile) {
      setGender(userProfile.gender || '');
      if (userProfile.birthDate) {
        setBirthDate(new Date(userProfile.birthDate));
      }
    }
  }, [user, userProfile]);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase();
    }
    return <UserIcon className="h-5 w-5" />;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setNewPhoto(result);
        setPhotoURL(result); 
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = () => {
    if (!user || !firestore || !auth.currentUser) return;
  
    setIsSaving(true);
  
    // 1. Update non-image data immediately in a non-blocking way
    const firestoreData: any = {
      displayName: displayName,
      gender,
      birthDate: birthDate ? birthDate.toISOString().split('T')[0] : null,
    };
  
    if (Object.keys(firestoreData).length > 0) {
      setDocumentNonBlocking(doc(firestore, 'users', user.uid), firestoreData, { merge: true });
    }
  
    if (displayName !== user.displayName) {
        if(auth.currentUser) {
            updateProfile(auth.currentUser, { displayName });
        }
    }
  
    // 2. If there's a new photo, upload it in the background
    if (newPhoto) {
      const storage = getStorage();
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);
      
      uploadString(storageRef, newPhoto, 'data_url').then(snapshot => {
        getDownloadURL(snapshot.ref).then(downloadURL => {
          // 3. Once uploaded, update the photoURL in Auth and Firestore in the background
          if (auth.currentUser) {
            updateProfile(auth.currentUser, { photoURL: downloadURL }).then(() => {
                auth.currentUser?.reload();
            });
          }
          setDocumentNonBlocking(doc(firestore, 'users', user.uid), { photoURL: downloadURL }, { merge: true });
        });
      }).catch(error => {
        console.error("Error uploading photo:", error);
        toast({
            variant: "destructive",
            title: t('editProfileErrorTitle'),
            description: "Failed to upload new profile picture.",
        });
      }).finally(() => {
        // This part is just for the case of upload finishing before navigation
        setIsSaving(false); 
      });
    } else {
        setIsSaving(false);
    }
  
    // 4. Immediately give feedback and navigate away
    toast({
      title: t('editProfileSuccessTitle'),
      description: t('editProfileSuccessDescription'),
    });
    router.push('/profile');
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
          <div className="grid gap-4 items-center">
            <Label>{t('profilePhoto')}</Label>
            <div className='flex items-center gap-4'>
                <Avatar className="h-20 w-20">
                    <AvatarImage src={photoURL ?? undefined} />
                    <AvatarFallback>{getInitials(displayName, user.email)}</AvatarFallback>
                </Avatar>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                    {t('changePhoto')}
                </Button>
                <Input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                />
            </div>
          </div>
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
                    "w-[240px] justify-start text-left font-normal",
                    !birthDate && "text-muted-foreground"
                    )}
                    disabled={isSaving}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "PPP", { locale: language === 'pl' ? pl : enUS }) : <span>{t('editProfileBirthDatePlaceholder')}</span>}
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
                    locale={language === 'pl' ? pl : enUS}
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
