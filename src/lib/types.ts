import { Timestamp } from 'firebase/firestore';

export interface UserSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
}

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    firstName?: string;
    lastName?: string;
    gender?: string;
    birthDate?: string | null;
    bio?: string;
    location?: string;
    website?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
    settings?: UserSettings;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    savedPosts?: string[]; // Post IDs
}

export interface Report {
    id: string;
    reporterId: string;
    reporterDisplayName: string;
    targetId: string; // postId or commentId
    targetType: 'post' | 'comment';
    targetContent: string; // Preview of content
    communityId: string;
    postId?: string; // Optional, for comments to find parent post
    reason: string;
    status: 'pending' | 'resolved' | 'dismissed';
    resolution?: string;
    resolvedBy?: string;
    createdAt: any; // Timestamp
}



export interface Conversation {
    id: string;
    participants: string[]; // User IDs
    participantDetails: {
        [userId: string]: {
            displayName: string;
            photoURL: string | null;
        }
    };
    lastMessage: string;
    lastMessageAt: any; // Timestamp
    unreadCounts: { [userId: string]: number };
    createdAt: any;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    voteCount: number;
    parentId?: string | null;
    content: string;
    createdAt: any;
    readBy: string[]; // User IDs who read it
}

export interface Comment {
    id: string;
    content: string;
    creatorId: string;
    creatorDisplayName: string;
    creatorPhotoURL?: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    voteCount: number;
    parentId?: string | null;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | null;
}

export interface Post {
    id: string;
    title: string;
    content: string;
    creatorId: string;
    creatorDisplayName: string;
    creatorPhotoURL?: string;
    communityId: string;
    communityName?: string; // Optional as it might be joined from community doc
    communityCreatorId?: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    voteCount: number;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | null;
}

export interface Community {
    id: string;
    name: string;
    description: string;
    creatorId: string;
    creatorDisplayName: string;
    createdAt: Timestamp;
    membersCount?: number;
    bannedUserIds?: string[];
}

export interface Notification {
    id: string;
    recipientId: string;
    type: 'vote' | 'comment';
    targetType: 'post' | 'comment';
    targetId: string;
    targetTitle?: string;
    communityId: string;
    postId: string;
    actorId: string;
    actorDisplayName: string;
    actorPhotoURL?: string;
    read: boolean;
    createdAt: any;
}
