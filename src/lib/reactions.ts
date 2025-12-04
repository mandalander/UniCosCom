export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'fire';

export interface Reaction {
    type: ReactionType;
    emoji: string;
    label: string;
}

export const REACTIONS: Record<ReactionType, { emoji: string; label: string }> = {
    like: { emoji: '👍', label: 'Like' },
    love: { emoji: '❤️', label: 'Love' },
    laugh: { emoji: '😂', label: 'Haha' },
    wow: { emoji: '😮', label: 'Wow' },
    sad: { emoji: '😢', label: 'Sad' },
    fire: { emoji: '🔥', label: 'Fire' },
};

export interface ReactionCounts {
    like?: number;
    love?: number;
    laugh?: number;
    wow?: number;
    sad?: number;
    fire?: number;
}
