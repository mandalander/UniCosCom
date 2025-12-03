'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from './language-provider';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface JoinButtonProps {
    communityId: string;
    communityName: string;
}

export function JoinButton({ communityId, communityName }: JoinButtonProps) {
    const { t } = useLanguage();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isJoined, setIsJoined] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isToggling, setIsToggling] = useState(false);

    useEffect(() => {
        const checkMembership = async () => {
            if (!user || !firestore || !communityId) {
                setIsLoading(false);
                return;
            }

            try {
                // Check if user is in community members
                const memberRef = doc(firestore, 'communities', communityId, 'members', user.uid);
                const memberSnap = await getDoc(memberRef);
                setIsJoined(memberSnap.exists());
            } catch (error) {
                console.error("Error checking membership:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkMembership();
    }, [user, firestore, communityId]);

    const handleToggleJoin = async () => {
        if (!user) {
            toast({ title: t('mustBeLoggedInToJoin') || "Log in to join" });
            return;
        }
        if (!firestore) return;

        setIsToggling(true);

        try {
            const memberRef = doc(firestore, 'communities', communityId, 'members', user.uid);
            const userMembershipRef = doc(firestore, 'users', user.uid, 'communityMemberships', communityId);

            if (isJoined) {
                // Leave
                await deleteDoc(memberRef);
                await deleteDoc(userMembershipRef);
                setIsJoined(false);
                toast({ title: t('leftCommunity') || "Left community" });
            } else {
                // Join
                await setDoc(memberRef, { joinedAt: serverTimestamp() });
                await setDoc(userMembershipRef, {
                    communityName: communityName,
                    joinedAt: serverTimestamp()
                });
                setIsJoined(true);
                toast({ title: t('joinedCommunity') || "Joined community" });
            }
        } catch (error) {
            console.error("Error toggling join:", error);
            toast({ variant: "destructive", title: t('error') });
        } finally {
            setIsToggling(false);
        }
    };

    if (isLoading) {
        return <Button variant="outline" disabled size="sm"><Loader2 className="h-4 w-4 animate-spin" /></Button>;
    }

    return (
        <Button
            variant={isJoined ? "outline" : "default"}
            size="sm"
            onClick={handleToggleJoin}
            disabled={isToggling}
        >
            {isToggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isJoined ? (t('leave') || "Leave") : (t('join') || "Join")}
        </Button>
    );
}
