'use client';

import { useState } from 'react';
import { REACTIONS, type ReactionType, type ReactionCounts } from '@/lib/reactions';
import { WhoReactedModal } from './who-reacted-modal';

interface ReactionDisplayProps {
    reactionCounts: ReactionCounts;
    compact?: boolean;
    targetType: 'post' | 'comment';
    targetId: string;
    communityId: string;
    postId?: string;
}

export function ReactionDisplay({
    reactionCounts,
    compact = false,
    targetType,
    targetId,
    communityId,
    postId,
}: ReactionDisplayProps) {
    const [showModal, setShowModal] = useState(false);

    // Get reactions sorted by count (descending)
    const sortedReactions = (Object.entries(reactionCounts) as [ReactionType, number][])
        .filter(([_, count]) => count > 0)
        .sort(([, a], [, b]) => b - a);

    if (sortedReactions.length === 0) {
        return null;
    }

    // Show top 3 in compact mode, all in normal mode
    const displayReactions = compact ? sortedReactions.slice(0, 3) : sortedReactions;

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity cursor-pointer"
                title="See who reacted"
            >
                {displayReactions.map(([type, count]) => (
                    <div
                        key={type}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                    >
                        <span className="text-base">{REACTIONS[type].emoji}</span>
                        <span className="text-xs font-medium text-muted-foreground">{count}</span>
                    </div>
                ))}
                {compact && sortedReactions.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                        +{sortedReactions.length - 3}
                    </span>
                )}
            </button>

            <WhoReactedModal
                open={showModal}
                onOpenChange={setShowModal}
                targetType={targetType}
                targetId={targetId}
                communityId={communityId}
                postId={postId}
                reactionCounts={reactionCounts}
            />
        </>
    );
}
