'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from './language-provider';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export function CreateCommunityDialog({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!firestore) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('dbConnectionError'),
      });
      return;
    }

    if (!communityName.trim()) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('communityNameRequired'),
      });
      return;
    }

    setIsCreating(true);

    const communitiesColRef = collection(firestore, 'communities');
    const communityData = {
      name: communityName,
      description: description,
      creatorId: user.uid,
      createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(communitiesColRef, communityData);

    toast({
      title: t('success'),
      description: t('communityCreatedSuccess', { name: communityName }),
    });

    setCommunityName('');
    setDescription('');
    setOpen(false);
    setIsCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('createNewCommunity')}</DialogTitle>
          <DialogDescription>{t('createCommunityDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="community-name" className="text-right">
              {t('communityName')}
            </Label>
            <Input
              id="community-name"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              className="col-span-3"
              disabled={isCreating}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="community-description" className="text-right">
              {t('communityDescription')}
            </Label>
            <Textarea
              id="community-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              disabled={isCreating}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isCreating}>{t('cancel')}</Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? t('creatingCommunity') : t('createCommunity')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
