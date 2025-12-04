'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/community/${post.communityId}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out this post: ${post.title}`,
          url: postUrl,
        });
      } catch (error) {
        // Silently catch the error
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
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
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "rounded-full h-8 px-3 text-xs flex items-center gap-1.5 transition-all duration-300",
        isCopied
          ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700"
          : "hover:bg-primary/10 hover:text-primary hover:scale-105"
      )}
      onClick={handleShare}
    >
      {isCopied ? (
        <Check className="h-4 w-4 animate-in zoom-in duration-300" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{isCopied ? t('copied') : t('share')}</span>
    </Button>
  );
}
