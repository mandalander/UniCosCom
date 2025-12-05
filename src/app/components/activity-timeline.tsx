'use client';

import { useFirestore } from '@/firebase';
import { collectionGroup, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FileText, MessageSquare, ThumbsUp, Clock } from 'lucide-react';
import { useLanguage } from './language-provider';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import Link from 'next/link';

interface ActivityItem {
    id: string;
    type: 'post' | 'comment' | 'reaction';
    title: string;
    description?: string;
    link: string;
    createdAt: Date;
}

interface ActivityTimelineProps {
    userId: string;
    maxItems?: number;
}

export function ActivityTimeline({ userId, maxItems = 5 }: ActivityTimelineProps) {
    const { t, language } = useLanguage();
    const firestore = useFirestore();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            if (!firestore || !userId) return;

            setIsLoading(true);
            try {
                const allActivities: ActivityItem[] = [];

                // Fetch recent posts
                const postsQuery = query(
                    collectionGroup(firestore, 'posts'),
                    where('creatorId', '==', userId),
                    orderBy('createdAt', 'desc'),
                    limit(maxItems)
                );
                const postsSnapshot = await getDocs(postsQuery);
                postsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const communityId = doc.ref.parent.parent?.id;
                    allActivities.push({
                        id: doc.id,
                        type: 'post',
                        title: data.title,
                        description: t('activityCreatedPost') || 'Created a post',
                        link: `/community/${communityId}/post/${doc.id}`,
                        createdAt: data.createdAt?.toDate() || new Date(),
                    });
                });

                // Fetch recent comments
                const commentsQuery = query(
                    collectionGroup(firestore, 'comments'),
                    where('authorId', '==', userId),
                    orderBy('createdAt', 'desc'),
                    limit(maxItems)
                );
                const commentsSnapshot = await getDocs(commentsQuery);
                commentsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    // comments path: communities/{communityId}/posts/{postId}/comments/{commentId}
                    const postRef = doc.ref.parent.parent;
                    const communityRef = postRef?.parent.parent;
                    const communityId = communityRef?.id;
                    const postId = postRef?.id;

                    if (communityId && postId) {
                        allActivities.push({
                            id: doc.id,
                            type: 'comment',
                            title: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : '') || '',
                            description: t('activityAddedComment') || 'Added a comment',
                            link: `/community/${communityId}/post/${postId}`,
                            createdAt: data.createdAt?.toDate() || new Date(),
                        });
                    }
                });

                // Sort by date and limit
                allActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setActivities(allActivities.slice(0, maxItems));
            } catch (error) {
                console.error('Error fetching activities:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();
    }, [firestore, userId, maxItems, t]);

    const getIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'post':
                return <FileText className="h-4 w-4" />;
            case 'comment':
                return <MessageSquare className="h-4 w-4" />;
            case 'reaction':
                return <ThumbsUp className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const getIconColor = (type: ActivityItem['type']) => {
        switch (type) {
            case 'post':
                return 'bg-violet-500/10 text-violet-500';
            case 'comment':
                return 'bg-blue-500/10 text-blue-500';
            case 'reaction':
                return 'bg-pink-500/10 text-pink-500';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                        <div className="h-8 w-8 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 rounded bg-muted" />
                            <div className="h-3 w-1/2 rounded bg-muted" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('noRecentActivity') || 'No recent activity'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {activities.map((activity, index) => (
                <Link
                    key={activity.id}
                    href={activity.link}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                    <div className={`p-2 rounded-full ${getIconColor(activity.type)}`}>
                        {getIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                            {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(activity.createdAt, {
                                addSuffix: true,
                                locale: language === 'pl' ? pl : enUS
                            })}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}
