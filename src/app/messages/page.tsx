'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ConversationList } from '@/app/components/conversation-list';
import { ChatWindow } from '@/app/components/chat-window';
import { useLanguage } from '@/app/components/language-provider';

export default function MessagesPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { t } = useLanguage();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

    if (isUserLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="container mx-auto py-6 h-[calc(100vh-4rem)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                <div className={`md:col-span-1 border rounded-lg overflow-hidden flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <ConversationList
                        selectedId={selectedConversationId}
                        onSelect={setSelectedConversationId}
                    />
                </div>
                <div className={`md:col-span-2 border rounded-lg overflow-hidden flex flex-col ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                    {selectedConversationId ? (
                        <ChatWindow
                            conversationId={selectedConversationId}
                            onBack={() => setSelectedConversationId(null)}
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
