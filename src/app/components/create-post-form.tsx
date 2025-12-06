import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLanguage } from './language-provider';
import { useUser, useFirestore, addDocumentNonBlocking, useStorage } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Video, X, Save } from 'lucide-react';

interface CreatePostFormProps {
  communityId: string;
  communityName: string;
}

export function CreatePostForm({ communityId, communityName }: CreatePostFormProps) {
  const { t } = useLanguage();
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Load draft on mount
  useEffect(() => {
    const draftKey = `post-draft-${communityId}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        form.setValue('title', draft.title || '');
        form.setValue('content', draft.content || '');
        setLastSaved(new Date(draft.savedAt));
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [communityId, form]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const draftKey = `post-draft-${communityId}`;
    const title = form.watch('title');
    const content = form.watch('content');

    // Only save if there's content
    if (!title && !content) return;

    const saveInterval = setInterval(() => {
      const draft = {
        title,
        content,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(draftKey, JSON.stringify(draft));
      setLastSaved(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(saveInterval);
  }, [communityId, form]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('fileTooLarge') || "File is too large (max 20MB)",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      if (file.type.startsWith('image/')) {
        setMediaType('image');
      } else if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else {
        setMediaType(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('invalidFileType') || "Invalid file type",
        });
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setMediaType(null);
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

    try {
      let mediaUrl = null;

      if (selectedFile) {
        const timestamp = Date.now();
        const storageRef = ref(storage, `communities/${communityId}/posts/${user.uid}/${timestamp}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        mediaUrl = await getDownloadURL(storageRef);
      }

      const postsColRef = collection(firestore, 'communities', communityId, 'posts');

      const postData = {
        title: data.title,
        content: data.content,
        creatorId: user.uid,
        creatorDisplayName: user.displayName || user.email || 'Anonymous',
        creatorPhotoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        voteCount: 0,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        communityName: communityName, // Save community name
        communityId: communityId, // Explicitly save communityId for collectionGroup queries
      };

      await addDocumentNonBlocking(postsColRef, postData);

      toast({
        title: t('postCreatedSuccessTitle'),
        description: t('postCreatedSuccessDescription'),
      });

      // Clear draft after successful submission
      const draftKey = `post-draft-${communityId}`;
      localStorage.removeItem(draftKey);
      setLastSaved(null);

      form.reset();
      clearFile();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('postCreationError') || "Failed to create post.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return <div className="p-4 text-center">{t('loading')}</div>;
  }

  if (!user) {
    return (
      <div className="text-center text-muted-foreground p-4 border rounded-md">
        <p>{t('logInToCreatePost')}</p>
        <Button onClick={() => router.push('/login')} className="mt-4">
          {t('login')}</Button>
      </div>
    )
  }


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
                <Textarea placeholder={t('postContentPlaceholder')} {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              {t('addImage') || "Add Image"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Video className="h-4 w-4 mr-2" />
              {t('addVideo') || "Add Video"}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileSelect}
            />
          </div>

          {previewUrl && (
            <div className="relative rounded-md overflow-hidden border bg-muted/50 max-h-[300px] flex items-center justify-center group">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={clearFile}
                aria-label={t('removeMedia') || "Remove media"}
              >
                <X className="h-4 w-4" />
              </Button>
              {mediaType === 'image' ? (
                <img src={previewUrl} alt="Preview" className="max-h-[300px] w-auto object-contain" />
              ) : (
                <video src={previewUrl} controls className="max-h-[300px] w-auto" />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {lastSaved && (
              <>
                <Save className="h-3 w-3" />
                <span>
                  {t('draftSaved') || 'Zapisano'} {new Date(lastSaved).toLocaleTimeString()}
                </span>
              </>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('creatingPost') : t('createPost')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
