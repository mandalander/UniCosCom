'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLanguage } from './language-provider';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface CreatePostFormProps {
    communityId: string;
}

export function CreatePostForm({ communityId }: CreatePostFormProps) {
  const { t } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FormSchema = z.object({
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
      title: '',
      content: '',
    },
  });

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!firestore) {
      toast({ variant: "destructive", title: t('error'), description: "Błąd połączenia z bazą danych." });
      return;
    }
    
    setIsSubmitting(true);

    const postsColRef = collection(firestore, 'communities', communityId, 'posts');
    
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
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('postTitle')}</FormLabel>
              <FormControl>
                <Input placeholder={t('postTitlePlaceholder')} {...field} disabled={isSubmitting} />
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
                <Textarea placeholder={t('postContentPlaceholder')} {...field} disabled={isSubmitting}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('creatingPost') : t('createPost')}
        </Button>
      </form>
    </Form>
  );
}
