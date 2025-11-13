'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useLanguage } from './language-provider';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

type Community = {
  id: string;
  name: string;
};

interface CreatePostDialogProps {
  children: React.ReactNode;
  communities: Community[];
}

export function CreatePostDialog({ children, communities }: CreatePostDialogProps) {
  const { t } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  
  const communityIdFromPath = pathname.startsWith('/community/') ? pathname.split('/')[2] : undefined;

  const FormSchema = z.object({
    communityId: z.string({
        required_error: t('mustSelectCommunity')
    }),
    title: z.string().min(3, {
      message: t('postTitleMinLength'),
    }),
    content: z.string().min(1, {
      message: t('postContentMinLength'),
    }),
  });
  
  const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
          communityId: communityIdFromPath || undefined,
          title: '',
          content: '',
      },
  });

  useEffect(() => {
    if(communityIdFromPath) {
        form.setValue('communityId', communityIdFromPath);
    }
  }, [communityIdFromPath, form]);


  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!firestore) {
      toast({ variant: 'destructive', title: t('error'), description: 'Database connection error.' });
      return;
    }

    const postsColRef = collection(firestore, 'communities', data.communityId, 'posts');

    const postData = {
      title: data.title,
      content: data.content,
      creatorId: user.uid,
      creatorDisplayName: user.displayName || user.email || 'Anonymous',
      creatorPhotoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(postsColRef, postData);

    toast({
      title: t('postCreatedSuccessTitle'),
      description: t('postCreatedSuccessDescription'),
    });

    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t('createNewPost')}</DialogTitle>
          <DialogDescription>{t('createPostDialogDescription')}</DialogDescription>
        </DialogHeader>
        
        {!user ? (
             <div className="py-8 text-center">
                <p className="mb-4">{t('logInToCreatePost')}</p>
                <Button onClick={() => router.push('/login')}>{t('login')}</Button>
            </div>
        ) : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                control={form.control}
                name="communityId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('community')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={t('selectCommunityPlaceholder')} />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {communities.map((community) => (
                            <SelectItem key={community.id} value={community.id}>
                            {community.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('postTitle')}</FormLabel>
                    <FormControl>
                        <Input placeholder={t('postTitlePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('postContent')}</FormLabel>
                    <FormControl>
                        <Textarea placeholder={t('postContentPlaceholder')} {...field} rows={6} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">{t('cancel')}</Button>
                    </DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? t('creatingPost') : t('createPost')}
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
