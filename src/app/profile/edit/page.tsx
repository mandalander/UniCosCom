
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useStorage, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
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
import { CalendarIcon, User as UserIcon, Twitter, Linkedin, Github } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';


export default function EditProfilePage() {
  const { t, language } = useLanguage();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [newPhotoDataUrl, setNewPhotoDataUrl] = useState<string | null>(null);
  const [coverURL, setCoverURL] = useState<string | null>(null);
  const [newCoverDataUrl, setNewCoverDataUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const userDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setGender(userProfile.gender || '');
      if (userProfile.birthDate) {
        setBirthDate(new Date(`${userProfile.birthDate}T00:00:00`));
      }
      if (userProfile.photoURL) {
        setPhotoURL(userProfile.photoURL);
      }
      if (userProfile.coverURL) {
        setCoverURL(userProfile.coverURL);
      }
      setBio(userProfile.bio || '');
      setLocation(userProfile.location || '');
      setWebsite(userProfile.website || '');
      setTwitter(userProfile.twitter || '');
      setLinkedin(userProfile.linkedin || '');
      setGithub(userProfile.github || '');
    } else if (user) {
      setDisplayName(user.displayName || '');
      const nameParts = user.displayName?.split(' ') || ['', ''];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setPhotoURL(user.photoURL || null);
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
        setNewPhotoDataUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setNewCoverDataUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user || !firestore || !auth.currentUser || !storage) return;

    setIsSaving(true);

    try {
      let finalPhotoUrl = userProfile?.photoURL || user?.photoURL;
      let finalCoverUrl = userProfile?.coverURL || null;

      if (newPhotoDataUrl) {
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        const snapshot = await uploadString(storageRef, newPhotoDataUrl, 'data_url');
        finalPhotoUrl = await getDownloadURL(snapshot.ref);
      }

      if (newCoverDataUrl) {
        const coverStorageRef = ref(storage, `cover-images/${user.uid}`);
        const coverSnapshot = await uploadString(coverStorageRef, newCoverDataUrl, 'data_url');
        finalCoverUrl = await getDownloadURL(coverSnapshot.ref);
      }

      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: finalPhotoUrl,
      });

      const batch = writeBatch(firestore);

      const userDocRef = doc(firestore, 'users', user.uid);
      const userProfileDocRef = doc(firestore, 'userProfiles', user.uid);

      const userPrivateData: any = {
        firstName: firstName,
        lastName: lastName,
        displayName: displayName,
        gender: gender,
        birthDate: birthDate ? format(birthDate, 'yyyy-MM-dd') : null,
        photoURL: finalPhotoUrl,
        coverURL: finalCoverUrl,
        bio,
        location,
        website,
        twitter,
        linkedin,
        github,
        updatedAt: serverTimestamp(),
      };
      batch.set(userDocRef, userPrivateData, { merge: true });

      const userPublicData = {
        displayName: displayName,
        photoURL: finalPhotoUrl,
        coverURL: finalCoverUrl,
        bio: bio,
        location: location,
        website: website,
        twitter: twitter,
        linkedin: linkedin,
        github: github,
        updatedAt: serverTimestamp(),
      };
      batch.set(userProfileDocRef, userPublicData, { merge: true });

      await batch.commit();

      await auth.currentUser.reload();

      toast({
        title: t('editProfileSuccessTitle'),
        description: t('editProfileSuccessDescription'),
      });

      router.push('/profile');

    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: t('editProfileErrorTitle'),
        description: (error as Error).message || t('editProfileErrorDescription'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !auth.currentUser || !user.email) return;

    if (newPassword !== confirmNewPassword) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('passwordsDoNotMatch'),
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('passwordTooShort'),
      });
      return;
    }

    setIsSaving(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      toast({
        title: t('success'),
        description: t('passwordUpdated'),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (error: any) {
      console.error("Error updating password:", error);
      let description = t('passwordUpdateError');
      if (error.code === 'auth/wrong-password') {
        description = t('wrongPassword');
      } else if (error.code === 'auth/too-many-requests') {
        description = t('tooManyRequests');
      }
      toast({
        variant: "destructive",
        title: t('error'),
        description: description,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !firestore || !auth.currentUser || !storage) return;

    setIsDeleting(true);

    try {
      // 1. Delete profile picture from Storage
      if (userProfile?.photoURL) {
        // Check if photoURL is a Firebase Storage URL
        if (userProfile.photoURL.includes('firebasestorage.googleapis.com')) {
          const photoRef = ref(storage, userProfile.photoURL);
          try {
            await deleteObject(photoRef);
          } catch (storageError: any) {
            if (storageError.code !== 'storage/object-not-found') {
              console.warn("Could not delete profile picture, it might have been already deleted:", storageError);
            }
          }
        }
      }

      const batch = writeBatch(firestore);

      // 2. Delete user documents from Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      const userProfileDocRef = doc(firestore, 'userProfiles', user.uid);
      batch.delete(userDocRef);
      batch.delete(userProfileDocRef);
      await batch.commit();

      // 3. Delete user from Auth
      await deleteUser(auth.currentUser);

      toast({
        title: t('deleteAccountSuccessTitle'),
        description: t('deleteAccountSuccessDescription'),
      });

      router.push('/'); // Redirect to home page after deletion

    } catch (error: any) {
      console.error("Error deleting account:", error);
      let description = t('deleteAccountErrorDescription');
      if (error.code === 'auth/requires-recent-login') {
        description = t('deleteAccountErrorReauth');
      }
      toast({
        variant: "destructive",
        title: t('deleteAccountErrorTitle'),
        description: description,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading && !user) {
    return <div>{t('profileLoading')}</div>;
  }

  if (!isUserLoading && !user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t('editProfileTitle')}</h1>
        <p className="text-muted-foreground">{t('editProfileDescription')}</p>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-1 h-auto sm:grid-cols-3">
          <TabsTrigger value="profile">{t('editProfileTabProfile')}</TabsTrigger>
          <TabsTrigger value="security">{t('editProfileTabSecurity')}</TabsTrigger>
          <TabsTrigger value="danger-zone">{t('editProfileTabDangerZone')}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="grid gap-4 items-center">
                  <Label>{t('profilePhoto')}</Label>
                  <div className='flex items-center gap-4'>
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={newPhotoDataUrl || photoURL || undefined} />
                      <AvatarFallback>{getInitials(displayName, user?.email)}</AvatarFallback>
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

                {/* Cover Image Upload */}
                <div className="grid gap-4">
                  <Label>{t('profileCoverImage') || 'Cover Image'}</Label>
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted/30">
                    {(newCoverDataUrl || coverURL) ? (
                      <img
                        src={newCoverDataUrl || coverURL || ''}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center">
                        <span className="text-white/70 text-sm">{t('noCoverImage') || 'No cover image'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/png, image/jpeg';
                        input.onchange = (e) => handleCoverFileChange(e as any);
                        input.click();
                      }}
                      disabled={isSaving}
                    >
                      {t('changeCoverImage') || 'Change Cover'}
                    </Button>
                    {(newCoverDataUrl || coverURL) && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setNewCoverDataUrl(null);
                          setCoverURL(null);
                        }}
                        disabled={isSaving}
                      >
                        {t('removeCover') || 'Remove'}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="displayName">{t('profileDisplayName')}</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('profileDisplayName')}
                    disabled={isSaving}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">{t('profileFirstName')}</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t('editProfileFirstNamePlaceholder')}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">{t('profileLastName')}</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t('editProfileLastNamePlaceholder')}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">{t('profileBio')}</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t('editProfileBioPlaceholder')}
                    disabled={isSaving}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="location">{t('profileLocation')}</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t('editProfileLocationPlaceholder')}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="website">{t('profileWebsite')}</Label>
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder={t('editProfileWebsitePlaceholder')}
                      disabled={isSaving}
                    />
                  </div>
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

                <div className="space-y-4">
                  <Label>{t('profileSocialLinks')}</Label>
                  <div className="flex items-center gap-2">
                    <Linkedin size={18} className="text-muted-foreground" />
                    <Input
                      id="linkedin"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder={t('editProfileSocialLinksPlaceholder')}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter size={18} className="text-muted-foreground" />
                    <Input
                      id="twitter"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder={t('editProfileSocialLinksPlaceholder')}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Github size={18} className="text-muted-foreground" />
                    <Input
                      id="github"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder={t('editProfileSocialLinksPlaceholder')}
                      disabled={isSaving}
                    />
                  </div>
                </div>

              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? t('editProfileSaving') : t('editProfileSave')}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t('editProfileTabSecurity')}</CardTitle>
              <CardDescription>{t('securityPrivacyDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('changePassword')}</h3>
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('currentPasswordPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">{t('newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('newPasswordPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmNewPassword">{t('confirmNewPassword')}</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder={t('confirmNewPasswordPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={isSaving}>
                  {isSaving ? t('saving') : t('updatePassword')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="danger-zone">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle>{t('dangerZone')}</CardTitle>
              <CardDescription>{t('dangerZoneDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      {isDeleting ? t('deleteAccountDeleting') : t('deleteAccountButton')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('deleteAccountDialogTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('deleteAccountDialogDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter onClick={(e) => e.preventDefault()}>
                      <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting}>
                        {t('deleteAccountConfirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
