'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking, useStorage } from '@/firebase';
import {
    collection, query, orderBy, onSnapshot, doc, updateDoc,
    serverTimestamp, deleteDoc, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Message, Conversation } from '@/lib/types';
import { useLanguage } from './language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft, Send, Check, CheckCheck, MoreVertical,
    Trash2, Edit, Image as ImageIcon, Smile, X
} from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
    conversationId: string;
    onBack: () => void;
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Listen to conversation and messages
    useEffect(() => {
        if (!firestore || !conversationId) return;

        const convRef = doc(firestore, 'conversations', conversationId);
        const unsubscribeConv = onSnapshot(convRef, (doc) => {
            if (doc.exists()) {
                const convData = { id: doc.id, ...doc.data() } as Conversation;
                setConversation(convData);

                // Check if other user is typing
                if (user && convData.typing) {
                    const otherId = convData.participants.find(p => p !== user.uid);
                    if (otherId && convData.typing[otherId]) {
                        setIsOtherTyping(true);
                    } else {
                        setIsOtherTyping(false);
                    }
                }
            }
        });

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
    }, [firestore, conversationId, user]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark messages as read when viewing
    useEffect(() => {
        if (!user || !firestore || !conversationId || messages.length === 0) return;

        const unreadMessages = messages.filter(
            msg => msg.senderId !== user.uid && !msg.readBy?.includes(user.uid)
        );

        if (unreadMessages.length > 0) {
            const batch = writeBatch(firestore);
            unreadMessages.forEach(msg => {
                const msgRef = doc(firestore, 'conversations', conversationId, 'messages', msg.id);
                batch.update(msgRef, {
                    readBy: [...(msg.readBy || []), user.uid]
                });
            });

            // Reset unread count for current user
            const convRef = doc(firestore, 'conversations', conversationId);
            batch.update(convRef, {
                [`unreadCounts.${user.uid}`]: 0
            });

            batch.commit().catch(console.error);
        }
    }, [messages, user, firestore, conversationId]);

    // Typing indicator - update when user types
    const updateTypingStatus = useCallback(async (isTyping: boolean) => {
        if (!user || !firestore || !conversationId) return;

        const convRef = doc(firestore, 'conversations', conversationId);
        try {
            await updateDoc(convRef, {
                [`typing.${user.uid}`]: isTyping
            });
        } catch (e) {
            // Ignore errors for typing updates
        }
    }, [user, firestore, conversationId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        // Set typing to true
        updateTypingStatus(true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set typing to false after 2 seconds of no typing
        typingTimeoutRef.current = setTimeout(() => {
            updateTypingStatus(false);
        }, 2000);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !firestore) return;

        const content = newMessage.trim();
        setNewMessage('');
        updateTypingStatus(false);

        try {
            const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
            await addDocumentNonBlocking(messagesRef, {
                conversationId,
                senderId: user.uid,
                content,
                createdAt: serverTimestamp(),
                readBy: [user.uid]
            });

            // Get other participant ID for unread count
            const otherId = conversation?.participants.find(p => p !== user.uid);

            const convRef = doc(firestore, 'conversations', conversationId);
            await updateDoc(convRef, {
                lastMessage: content,
                lastMessageAt: serverTimestamp(),
                [`typing.${user.uid}`]: false,
                ...(otherId ? { [`unreadCounts.${otherId}`]: (conversation?.unreadCounts?.[otherId] || 0) + 1 } : {})
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!firestore) return;

        try {
            const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
            await updateDoc(msgRef, {
                isDeleted: true,
                content: ''
            });
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    const handleEditMessage = async () => {
        if (!firestore || !editingMessageId || !editContent.trim()) return;

        try {
            const msgRef = doc(firestore, 'conversations', conversationId, 'messages', editingMessageId);
            await updateDoc(msgRef, {
                content: editContent.trim(),
                isEdited: true
            });
            setEditingMessageId(null);
            setEditContent('');
        } catch (error) {
            console.error("Error editing message:", error);
        }
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        if (!user || !firestore) return;

        try {
            const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
            const message = messages.find(m => m.id === messageId);

            if (!message) return;

            const reactions = message.reactions || {};
            const emojiReactions = reactions[emoji] || [];

            if (emojiReactions.includes(user.uid)) {
                // Remove reaction
                await updateDoc(msgRef, {
                    [`reactions.${emoji}`]: emojiReactions.filter(id => id !== user.uid)
                });
            } else {
                // Add reaction
                await updateDoc(msgRef, {
                    [`reactions.${emoji}`]: [...emojiReactions, user.uid]
                });
            }
        } catch (error) {
            console.error("Error adding reaction:", error);
        }
    };

    const getOtherParticipant = () => {
        if (!user || !conversation) return null;
        const otherId = conversation.participants.find(p => p !== user.uid);
        if (!otherId) return null;
        return conversation.participantDetails[otherId];
    };

    const formatMessageDate = (date: Date) => {
        if (isToday(date)) return t('today') || 'Today';
        if (isYesterday(date)) return t('yesterday') || 'Yesterday';
        return format(date, 'PP', { locale: language === 'pl' ? pl : enUS });
    };

    const shouldShowDateDivider = (currentMsg: Message, prevMsg: Message | null) => {
        if (!prevMsg || !currentMsg.createdAt?.toDate || !prevMsg.createdAt?.toDate) return false;
        return !isSameDay(currentMsg.createdAt.toDate(), prevMsg.createdAt.toDate());
    };

    const otherParticipant = getOtherParticipant();

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3 bg-muted/30">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar>
                    <AvatarImage src={otherParticipant?.photoURL || undefined} />
                    <AvatarFallback>{otherParticipant?.displayName?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-semibold">{otherParticipant?.displayName || 'Chat'}</h3>
                    {isOtherTyping && (
                        <span className="text-xs text-primary animate-pulse">
                            {t('userIsTyping') || 'typing...'}
                        </span>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === user?.uid;
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showDateDivider = index === 0 || shouldShowDateDivider(msg, prevMsg);
                    const isReadByOther = msg.readBy?.length > 1;

                    return (
                        <div key={msg.id}>
                            {/* Date divider */}
                            {showDateDivider && msg.createdAt?.toDate && (
                                <div className="flex items-center justify-center my-4">
                                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                                        {formatMessageDate(msg.createdAt.toDate())}
                                    </div>
                                </div>
                            )}

                            {/* Message */}
                            <div className={cn("flex group", isMe ? 'justify-end' : 'justify-start')}>
                                <div className="relative max-w-[75%]">
                                    {msg.isDeleted ? (
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2 italic text-muted-foreground bg-muted/50",
                                            isMe ? 'rounded-br-sm' : 'rounded-bl-sm'
                                        )}>
                                            {t('messageDeleted') || 'Message deleted'}
                                        </div>
                                    ) : (
                                        <>
                                            <div className={cn(
                                                "rounded-2xl px-4 py-2 shadow-sm",
                                                isMe
                                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                    : 'bg-muted rounded-bl-sm'
                                            )}>
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                                <div className={cn(
                                                    "flex items-center gap-1 mt-1 text-[10px]",
                                                    isMe ? 'justify-end text-primary-foreground/70' : 'text-muted-foreground'
                                                )}>
                                                    {msg.isEdited && <span>({t('edited') || 'edited'})</span>}
                                                    <span>{msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : '...'}</span>
                                                    {isMe && (
                                                        isReadByOther
                                                            ? <CheckCheck className="h-3 w-3 text-blue-400" />
                                                            : <Check className="h-3 w-3" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reactions display */}
                                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                <div className={cn(
                                                    "flex gap-1 mt-1 flex-wrap",
                                                    isMe ? 'justify-end' : 'justify-start'
                                                )}>
                                                    {Object.entries(msg.reactions).map(([emoji, userIds]) =>
                                                        userIds.length > 0 && (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => handleReaction(msg.id, emoji)}
                                                                className={cn(
                                                                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs bg-muted hover:bg-muted/80 transition-colors",
                                                                    userIds.includes(user?.uid || '') && 'ring-1 ring-primary'
                                                                )}
                                                            >
                                                                <span>{emoji}</span>
                                                                {userIds.length > 1 && <span>{userIds.length}</span>}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            {/* Message actions (visible on hover) */}
                                            <div className={cn(
                                                "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
                                                isMe ? '-left-16' : '-right-16'
                                            )}>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <Smile className="h-3 w-3" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-2" side="top">
                                                        <div className="flex gap-1">
                                                            {QUICK_REACTIONS.map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => handleReaction(msg.id, emoji)}
                                                                    className="p-1 hover:bg-muted rounded transition-colors text-lg"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>

                                                {isMe && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                <MoreVertical className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => {
                                                                setEditingMessageId(msg.id);
                                                                setEditContent(msg.content);
                                                            }}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                {t('edit') || 'Edit'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteMessage(msg.id)}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                {t('delete') || 'Delete'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Typing indicator */}
                {isOtherTyping && (
                    <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Edit mode */}
            {editingMessageId && (
                <div className="p-2 border-t bg-muted/50 flex items-center gap-2">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('editingMessage') || 'Editing message'}</span>
                    <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setEditingMessageId(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Input */}
            <form onSubmit={editingMessageId ? (e) => { e.preventDefault(); handleEditMessage(); } : handleSendMessage} className="p-4 border-t flex gap-2">
                <Input
                    value={editingMessageId ? editContent : newMessage}
                    onChange={editingMessageId ? (e) => setEditContent(e.target.value) : handleInputChange}
                    placeholder={t('typeMessage') || 'Type a message...'}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={editingMessageId ? !editContent.trim() : !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
