'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Message, Conversation } from '@/lib/types';
import { useLanguage } from './language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';

interface ChatWindowProps {
    conversationId: string;
    onBack: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!firestore || !conversationId) return;

        // Fetch conversation details
        const convRef = doc(firestore, 'conversations', conversationId);
        const unsubscribeConv = onSnapshot(convRef, (doc) => {
            if (doc.exists()) {
                setConversation({ id: doc.id, ...doc.data() } as Conversation);
            }
        });

        // Fetch messages
        const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            setMessages(msgs);
        });

        return () => {
            unsubscribeConv();
            unsubscribeMessages();
        };
    }, [firestore, conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !firestore) return;

        const content = newMessage.trim();
        setNewMessage('');

        try {
            // Add message
            const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
            await addDocumentNonBlocking(messagesRef, {
                conversationId,
                senderId: user.uid,
                content,
                createdAt: serverTimestamp(),
                readBy: [user.uid]
            });

            // Update conversation
            const convRef = doc(firestore, 'conversations', conversationId);

            // Calculate new unread counts
            // We need to increment unread count for everyone EXCEPT the sender
            // Since we can't easily do atomic increment for specific map keys without knowing current values or using a cloud function,
            // we will do a best-effort client-side update here or just set it. 
            // A proper solution requires a transaction or cloud function.
            // For MVP, let's just update lastMessage. Unread count logic is complex for client-side only.
            // We will skip unread count increment for now to keep it simple and safe, or try a transaction.

            await updateDoc(convRef, {
                lastMessage: content,
                lastMessageAt: serverTimestamp(),
                // unreadCounts: ... (omitted for MVP simplicity to avoid race conditions)
            });

        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const getOtherParticipant = () => {
        if (!user || !conversation) return null;
        const otherId = conversation.participants.find(p => p !== user.uid);
        if (!otherId) return null;
        return conversation.participantDetails[otherId];
    };

    const otherParticipant = getOtherParticipant();

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar>
                    <AvatarImage src={otherParticipant?.photoURL || undefined} />
                    <AvatarFallback>{otherParticipant?.displayName?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold">{otherParticipant?.displayName || 'Chat'}</h3>
                    {/* <span className="text-xs text-muted-foreground">{t('online')}</span> */}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                                <p className="text-sm">{msg.content}</p>
                                <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : '...'}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('typeMessage')}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
