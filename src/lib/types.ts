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
}

export interface Report {
    id: string;
    reporterId: string;
    reporterDisplayName: string;
    targetId: string; // postId or commentId
    targetType: 'post' | 'comment';
    targetContent: string; // Preview of content
    communityId: string;
    reason: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: any; // Timestamp
}
