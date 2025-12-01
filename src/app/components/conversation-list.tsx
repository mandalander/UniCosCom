'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Conversation } from '@/lib/types';
import { useLanguage } from './language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';

interface ConversationListProps {
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { t, language } = useLanguage();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user || !firestore) return;

        const q = query(
            collection(firestore, 'conversations'),
            where('participants', 'array-contains', user.uid),
            orderBy('lastMessageAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Conversation[];
            setConversations(convs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, firestore]);

    const getOtherParticipant = (conversation: Conversation) => {
        if (!user) return null;
        const otherId = conversation.participants.find(p => p !== user.uid);
        if (!otherId) return null;
        return conversation.participantDetails[otherId];
    };

    const filteredConversations = conversations.filter(conv => {
        const other = getOtherParticipant(conv);
        return other?.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return <div className="p-4 text-center text-muted-foreground">{t('loading')}</div>;
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 border-b space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{t('messages')}</h2>
                    <Button size="icon" variant="ghost">
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('searchUsers')}
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        {t('noConversations')}
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredConversations.map((conv) => {
                            const other = getOtherParticipant(conv);
                            const isUnread = (conv.unreadCounts?.[user?.uid || ''] || 0) > 0;

                            return (
                                <div
                                    key={conv.id}
                                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedId === conv.id ? 'bg-muted' : ''}`}
                                    onClick={() => onSelect(conv.id)}
                                >
                                    <div className="flex gap-3">
                                        <Avatar>
                                            <AvatarImage src={other?.photoURL || undefined} />
                                            <AvatarFallback>{other?.displayName?.[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className={`font-medium truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {other?.displayName}
                                                </span>
                                                {conv.lastMessageAt && (
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                        {formatDistanceToNow(conv.lastMessageAt?.toDate(), {
                                                            addSuffix: true,
                                                            locale: language === 'pl' ? pl : enUS
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm truncate ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                        {isUnread && (
                                            <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
