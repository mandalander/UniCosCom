'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './language-provider';

interface ShareButtonProps {
  post: {
    id: string;
    title: string;
    communityId: string;
  };
}

export function ShareButton({ post }: ShareButtonProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const postUrl = `${window.location.origin}/community/${post.communityId}/post/${post.id}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out this post: ${post.title}`,
          url: postUrl,
        });
      } catch (error) {
        // Silently catch the error, as it's likely the user canceled the share sheet.
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        toast({
          description: t('linkCopied'),
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          variant: 'destructive',
          description: t('linkCopyFailed'),
        });
      }
    }
  };

  return (
    <Button variant="ghost" className="rounded-full h-auto p-2 text-sm flex items-center gap-2 hover:scale-105 hover:bg-primary/10 hover:text-primary transition-all duration-300" onClick={handleShare}>
      <Share2 className="h-5 w-5" />
      <span>{t('share')}</span>
    </Button>
  );
}
