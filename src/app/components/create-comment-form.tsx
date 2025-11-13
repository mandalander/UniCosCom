'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from './language-provider';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface CreateCommentFormProps {
    communityId: string;
    postId: string;
}

export function CreateCommentForm({ communityId, postId }: CreateCommentFormProps) {
  const { t } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FormSchema = z.object({
    content: z.string().min(1, { message: t('commentCannotBeEmpty') }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
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

    const commentsColRef = collection(firestore, 'communities', communityId, 'posts', postId, 'comments');
    
    const commentData = {
      content: data.content,
      creatorId: user.uid,
      creatorDisplayName: user.displayName || user.email || 'Anonymous',
      creatorPhotoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
    };
    
    addDocumentNonBlocking(commentsColRef, commentData);

    toast({
      title: t('commentAddedSuccessTitle'),
    });
    
    form.reset();
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder={t('typeYourCommentPlaceholder')} {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('commenting') : t('addComment')}
        </Button>
      </form>
    </Form>
  );
}
