'use client';

import { useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { uploadString, getDownloadURL, ref } from 'firebase/storage';
import { useStorage } from '@/firebase';

// ... (imports)

export function CreateCommentForm({ communityId, postId, postAuthorId, postTitle, parentId, onCancel }: CreateCommentFormProps) {
  const { t } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const FormSchema = z.object({
    content: z.string().min(1, { message: t('commentCannotBeEmpty') }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      content: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('fileTooLarge') || "File is too large (max 5MB)",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!firestore || !storage) {
      toast({ variant: "destructive", title: t('error'), description: "Błąd połączenia z bazą danych." });
      return;
    }

    setIsSubmitting(true);

    let mediaUrl = null;
    let mediaType = null;

    try {
      if (selectedImage) {
        const storageRef = ref(storage, `comments/${communityId}/${postId}/${user.uid}_${Date.now()}`);
        const snapshot = await uploadString(storageRef, selectedImage, 'data_url');
        mediaUrl = await getDownloadURL(snapshot.ref);
        mediaType = 'image';
      }

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
        parentId: parentId || null,
        mediaUrl,
        mediaType,
      };

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
        const { addDoc } = await import('firebase/firestore');
        addDoc(notificationsRef, notificationData).catch(e => console.error("Error sending notification:", e));
      }

      toast({
        title: t('commentAddedSuccessTitle'),
      });

      form.reset();
      setSelectedImage(null);
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
          {t('login') || "Log in"}
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

        {selectedImage && (
          <div className="relative w-full max-w-xs">
            <img src={selectedImage} alt="Preview" className="rounded-md border max-h-40 object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('commenting') : t('addComment')}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              {t('cancel') || "Cancel"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
