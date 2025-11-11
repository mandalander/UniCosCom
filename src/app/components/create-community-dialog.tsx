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
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function CreateCommunityDialog({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Musisz być zalogowany, aby utworzyć społeczność.",
      });
      return;
    }
    if (!communityName.trim()) {
       toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nazwa społeczności nie może być pusta.",
      });
      return;
    }

    setIsCreating(true);

    try {
      const communitiesColRef = collection(firestore, 'communities');
      await addDocumentNonBlocking(communitiesColRef, {
        name: communityName,
        description: description,
        creatorId: user.uid,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Sukces!",
        description: `Społeczność "${communityName}" została utworzona.`,
      });
      
      setCommunityName('');
      setDescription('');
      setOpen(false);

    } catch (error) {
      console.error('Error creating community:', error);
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się utworzyć społeczności.",
      });
    } finally {
      setIsCreating(false);
    }
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
            {isCreating ? "Tworzenie..." : t('createCommunity')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
