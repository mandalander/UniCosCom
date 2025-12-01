import { useState, useRef } from 'react';
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
import { Image as ImageIcon, Video, X } from 'lucide-react';

interface CreatePostFormProps {
  communityId: string;
}

export function CreatePostForm({ communityId }: CreatePostFormProps) {
  const { t } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
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
      };

      await addDocumentNonBlocking(postsColRef, postData);

      toast({
        title: t('postCreatedSuccessTitle'),
        description: t('postCreatedSuccessDescription'),
      });

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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('creatingPost') : t('createPost')}
        </Button>
      </form>
    </Form>
  );
}
