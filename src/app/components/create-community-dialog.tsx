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
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export function CreateCommunityDialog({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const { user } = useUser();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!user) {
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

    // Simulate creation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Sukces! (Symulacja)",
      description: `Społeczność "${communityName}" została utworzona. Ta funkcja jest obecnie demonstracyjna.`,
    });
    
    setCommunityName('');
    setDescription('');
    setIsCreating(false);
    setOpen(false);
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
