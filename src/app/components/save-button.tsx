'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './language-provider';

interface SaveButtonProps {
    postId: string;
    communityId: string;
}

export function SaveButton({ postId, communityId }: SaveButtonProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { t } = useLanguage();
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Construct full post reference for saved posts
    const fullPostId = `${communityId}/${postId}`;

    useEffect(() => {
        if (!user || !firestore) return;

        const checkSaved = async () => {
            try {
                const userProfileRef = doc(firestore, 'userProfiles', user.uid);
                const userProfileSnap = await getDoc(userProfileRef);

                if (userProfileSnap.exists()) {
                    const savedPosts = userProfileSnap.data().savedPosts || [];
                    setIsSaved(savedPosts.includes(fullPostId));
                }
            } catch (error) {
                console.error('Error checking saved status:', error);
            }
        };

        checkSaved();
    }, [user, firestore, fullPostId]);

    const handleToggleSave = async () => {
        if (!user || !firestore) {
            toast({
                variant: 'destructive',
                description: t('loginRequired') || 'Please log in to save posts.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const userProfileRef = doc(firestore, 'userProfiles', user.uid);

            if (isSaved) {
                await updateDoc(userProfileRef, {
                    savedPosts: arrayRemove(fullPostId),
                });
                setIsSaved(false);
                toast({ description: t('postUnsaved') || 'Post removed from saved.' });
            } else {
                await updateDoc(userProfileRef, {
                    savedPosts: arrayUnion(fullPostId),
                });
                setIsSaved(true);
                toast({ description: t('postSaved') || 'Post saved!' });
            }
        } catch (error) {
            console.error('Error toggling save:', error);
            toast({
                variant: 'destructive',
                description: t('error') || 'An error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            className="rounded-full h-8 px-3 text-xs"
            onClick={handleToggleSave}
            disabled={isLoading}
        >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            <span className="ml-1.5">{isSaved ? t('saved') : t('save')}</span>
        </Button>
    );
}
