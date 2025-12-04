'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { REACTIONS, type ReactionType, type ReactionCounts } from '@/lib/reactions';
import { useReactionUsers } from '@/hooks/use-reaction-users';

interface WhoReactedModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetType: 'post' | 'comment';
    targetId: string;
    communityId: string;
    postId?: string;
    reactionCounts: ReactionCounts;
}

export function WhoReactedModal({
    open,
    onOpenChange,
    targetType,
    targetId,
    communityId,
    postId,
    reactionCounts,
}: WhoReactedModalProps) {
    const { usersByReaction, isLoading, error } = useReactionUsers({
        targetType,
        targetId,
        communityId,
        postId,
        enabled: open,
    });

    // Get reaction types that have users
    const activeReactions = (Object.keys(reactionCounts) as ReactionType[])
        .filter((type) => (reactionCounts[type] || 0) > 0)
        .sort((a, b) => (reactionCounts[b] || 0) - (reactionCounts[a] || 0));

    const [selectedTab, setSelectedTab] = useState<ReactionType | undefined>(
        activeReactions[0]
    );

    // Update selected tab when active reactions change
    if (selectedTab && !activeReactions.includes(selectedTab) && activeReactions.length > 0) {
        setSelectedTab(activeReactions[0]);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Reactions</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-destructive">
                        <p>Failed to load reactions</p>
                    </div>
                ) : activeReactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No reactions yet</p>
                    </div>
                ) : (
                    <Tabs
                        value={selectedTab}
                        onValueChange={(value) => setSelectedTab(value as ReactionType)}
                        className="flex-1 flex flex-col min-h-0"
                    >
                        <TabsList className="grid w-full grid-cols-6 mb-4">
                            {activeReactions.map((type) => (
                                <TabsTrigger
                                    key={type}
                                    value={type}
                                    className="flex flex-col items-center gap-1 px-2 py-2"
                                    title={REACTIONS[type].label}
                                >
                                    <span className="text-xl">{REACTIONS[type].emoji}</span>
                                    <span className="text-xs font-medium">
                                        {reactionCounts[type] || 0}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="flex-1 overflow-y-auto pr-2">
                            {activeReactions.map((type) => (
                                <TabsContent key={type} value={type} className="mt-0">
                                    {usersByReaction[type]?.length > 0 ? (
                                        <div className="space-y-2">
                                            {usersByReaction[type].map((user) => (
                                                <Link
                                                    key={user.userId}
                                                    href={`/profile/${user.userId}`}
                                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                                                    onClick={() => onOpenChange(false)}
                                                >
                                                    <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                                        <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                                                            {user.displayName.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                                            {user.displayName}
                                                        </p>
                                                        {user.createdAt && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatRelativeTime(user.createdAt)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {REACTIONS[type].emoji}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p className="text-sm">No users with this reaction</p>
                                        </div>
                                    )}
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}
