'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ConversationList } from '@/app/components/conversation-list';
import { ChatWindow } from '@/app/components/chat-window';
import { useLanguage } from '@/app/components/language-provider';

function MessagesContent() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

    useEffect(() => {
        const conversationId = searchParams.get('conversationId');
        if (conversationId) {
            setSelectedConversationId(conversationId);
        }
    }, [searchParams]);

    const handleSelectConversation = (id: string) => {
        setSelectedConversationId(id);
        // Update URL without full reload
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('conversationId', id);
        router.push(`/messages?${newParams.toString()}`);
    };

    const handleBack = () => {
        setSelectedConversationId(null);
        router.push('/messages');
    };

    if (isUserLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto py-6 h-[calc(100vh-4rem)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                <div className={`md:col-span-1 border rounded-lg overflow-hidden flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <ConversationList
                        selectedId={selectedConversationId}
                        onSelect={handleSelectConversation}
                    />
                </div>
                <div className={`md:col-span-2 border rounded-lg overflow-hidden flex flex-col ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                    {selectedConversationId ? (
                        <ChatWindow
                            conversationId={selectedConversationId}
                            onBack={handleBack}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            {t('selectConversationToStart') || "Select a conversation to start chatting"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MessagesContent />
        </Suspense>
    );
}
