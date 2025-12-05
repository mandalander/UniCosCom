'use client';

import { useFirestore, useUser } from '@/firebase';
import { collection, collectionGroup, query, where, getCountFromServer } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FileText, MessageSquare, Users, Award } from 'lucide-react';
import { useLanguage } from './language-provider';

interface UserStatsProps {
    userId?: string;
}

interface Stats {
    postsCount: number;
    commentsCount: number;
    communitiesCount: number;
}

export function UserStats({ userId }: UserStatsProps) {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const { user } = useUser();
    const [stats, setStats] = useState<Stats>({ postsCount: 0, commentsCount: 0, communitiesCount: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const targetUserId = userId || user?.uid;

    useEffect(() => {
        const fetchStats = async () => {
            if (!firestore || !targetUserId) return;

            setIsLoading(true);
            try {
                // Count posts
                const postsQuery = query(
                    collectionGroup(firestore, 'posts'),
                    where('creatorId', '==', targetUserId)
                );
                const postsSnapshot = await getCountFromServer(postsQuery);

                // Count comments
                const commentsQuery = query(
                    collectionGroup(firestore, 'comments'),
                    where('authorId', '==', targetUserId)
                );
                const commentsSnapshot = await getCountFromServer(commentsQuery);

                // Count communities (where user is member)
                const communitiesQuery = query(
                    collection(firestore, 'communities'),
                    where('memberIds', 'array-contains', targetUserId)
                );
                const communitiesSnapshot = await getCountFromServer(communitiesQuery);

                setStats({
                    postsCount: postsSnapshot.data().count,
                    commentsCount: commentsSnapshot.data().count,
                    communitiesCount: communitiesSnapshot.data().count,
                });
            } catch (error) {
                console.error('Error fetching user stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [firestore, targetUserId]);

    const statItems = [
        {
            icon: FileText,
            label: t('posts'),
            value: stats.postsCount,
            gradient: 'from-violet-500 to-purple-500',
        },
        {
            icon: MessageSquare,
            label: t('commentsTitle'),
            value: stats.commentsCount,
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Users,
            label: t('communities'),
            value: stats.communitiesCount,
            gradient: 'from-emerald-500 to-teal-500',
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {statItems.map((item) => (
                <div
                    key={item.label}
                    className="relative overflow-hidden rounded-xl bg-muted/30 p-3 sm:p-4 backdrop-blur-sm border border-white/5 hover:bg-muted/50 transition-all duration-300 group"
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <div className="relative z-10 flex flex-col items-center text-center gap-1">
                        <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 bg-gradient-to-br ${item.gradient} bg-clip-text text-transparent`} style={{ stroke: 'url(#gradient)' }} />
                        <span className="text-xl sm:text-2xl font-bold">
                            {isLoading ? (
                                <span className="animate-pulse">-</span>
                            ) : (
                                stats[item.label === t('posts') ? 'postsCount' : item.label === t('commentsTitle') ? 'commentsCount' : 'communitiesCount']
                            )}
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground truncate w-full">{item.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
