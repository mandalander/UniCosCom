'use client';

import { useState } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Loader2, MessageSquarePlus } from 'lucide-react';
import { useLanguage } from './language-provider';
import { UserProfile } from '@/lib/types';

interface NewConversationDialogProps {
    onConversationCreated: (conversationId: string) => void;
}

export function NewConversationDialog({ onConversationCreated }: NewConversationDialogProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (!term.trim() || !firestore) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Simple search by displayName prefix
            // Note: In a real app, you'd want a more robust search (e.g. Algolia or full-text search)
            // and maybe exclude the current user.
            const usersRef = collection(firestore, 'userProfiles');
            const q = query(
                usersRef,
                where('displayName', '>=', term),
                where('displayName', '<=', term + '\uf8ff'),
                // limit(5) // Optional limit
            );

            const snapshot = await getDocs(q);
            const users = snapshot.docs
                .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
                .filter(u => u.uid !== user?.uid); // Exclude self

            setSearchResults(users);
        } catch (error) {
            console.error("Error searching users:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleUserSelect = async (selectedUser: UserProfile) => {
        if (!user || !firestore) return;
        setIsCreating(true);

        try {
            // 1. Check if conversation already exists
            // Since we can't query array-contains for multiple values easily without composite keys,
            // we'll fetch all conversations for the current user and filter client-side.
            // This is okay for MVP scale.
            const conversationsRef = collection(firestore, 'conversations');
            const q = query(conversationsRef, where('participants', 'array-contains', user.uid));
            const snapshot = await getDocs(q);

            const existingConv = snapshot.docs.find(doc => {
                const data = doc.data();
                return data.participants.includes(selectedUser.uid) && data.participants.length === 2;
            });

            if (existingConv) {
                onConversationCreated(existingConv.id);
                setIsOpen(false);
                setIsCreating(false);
                return;
            }

            // 2. Create new conversation
            const newConvRef = doc(collection(firestore, 'conversations'));
            const newConversationData = {
                id: newConvRef.id,
                participants: [user.uid, selectedUser.uid],
                participantDetails: {
                    [user.uid]: {
                        displayName: user.displayName || 'User',
                        photoURL: user.photoURL
                    },
                    [selectedUser.uid]: {
                        displayName: selectedUser.displayName || 'User',
                        photoURL: selectedUser.photoURL
                    }
                },
                lastMessage: '',
                lastMessageAt: serverTimestamp(),
                unreadCounts: {
                    [user.uid]: 0,
                    [selectedUser.uid]: 0
                },
                createdAt: serverTimestamp()
            };

            await setDoc(newConvRef, newConversationData);

            onConversationCreated(newConvRef.id);
            setIsOpen(false);

        } catch (error) {
            console.error("Error creating conversation:", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost">
                    <Plus className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('newConversation') || "New Conversation"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('searchUsers') || "Search users..."}
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                        {isSearching ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-2">
                                {searchResults.map((u) => (
                                    <div
                                        key={u.uid}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                        onClick={() => handleUserSelect(u)}
                                    >
                                        <Avatar>
                                            <AvatarImage src={u.photoURL || undefined} />
                                            <AvatarFallback>{u.displayName?.[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{u.displayName}</p>
                                            {/* <p className="text-xs text-muted-foreground">{u.email}</p> */}
                                        </div>
                                        {isCreating && (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : searchTerm ? (
                            <div className="text-center text-muted-foreground py-8">
                                {t('noResults') || "No results found."}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8 flex flex-col items-center gap-2">
                                <MessageSquarePlus className="h-8 w-8 opacity-50" />
                                <p>{t('typeToSearch') || "Type to search for users"}</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
