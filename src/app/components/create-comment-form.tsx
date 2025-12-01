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
  postAuthorId: string;
  postTitle: string;
}

export function CreateCommentForm({ communityId, postId, postAuthorId, postTitle }: CreateCommentFormProps) {
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

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
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
      upvotes: 0,
      downvotes: 0,
      voteCount: 0,
    };

    try {
      await addDocumentNonBlocking(commentsColRef, commentData);

      // Create notification for post author
      if (user.uid !== postAuthorId) {
        const notificationsRef = collection(firestore, 'userProfiles', postAuthorId, 'notifications');
        const notificationData = {
          recipientId: postAuthorId,
          type: 'comment',
          targetType: 'post',
          targetId: postId,
          targetTitle: postTitle,
          communityId: communityId,
          postId: postId,
          actorId: user.uid,
          actorDisplayName: user.displayName || 'Someone',
          read: false,
          createdAt: serverTimestamp(),
        };
        // We use addDoc here (via firestore directly or helper if available, but addDoc is standard)
        // Since addDocumentNonBlocking is for specific collection structure, we'll use standard addDoc logic or just fire and forget
        // Importing addDoc from firebase/firestore if not already imported
        const { addDoc } = await import('firebase/firestore');
        addDoc(notificationsRef, notificationData).catch(e => console.error("Error sending notification:", e));
      }

      toast({
        title: t('commentAddedSuccessTitle'),
      });

      form.reset();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('commentCreationError') || "Failed to add comment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center text-muted-foreground">
        <p>{t('logInToAddComment')}</p>
        <Button onClick={() => router.push('/login')} className="mt-4" variant="outline">
          {t('login')}
        </Button>
      </div>
    )
  }

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
