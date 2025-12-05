'use client';

import { Award, Shield, Star, Zap, Heart, Trophy } from 'lucide-react';
import { useLanguage } from './language-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type BadgeType = 'early_adopter' | 'verified' | 'top_contributor' | 'moderator' | 'active_member' | 'helpful';

interface Badge {
    type: BadgeType;
    icon: React.ElementType;
    label: string;
    description: string;
    color: string;
    bgColor: string;
}

interface UserBadgesProps {
    badges: BadgeType[];
    size?: 'sm' | 'md' | 'lg';
}

export function UserBadges({ badges, size = 'md' }: UserBadgesProps) {
    const { t } = useLanguage();

    const badgeDefinitions: Record<BadgeType, Omit<Badge, 'type'>> = {
        early_adopter: {
            icon: Star,
            label: t('badgeEarlyAdopter') || 'Early Adopter',
            description: t('badgeEarlyAdopterDesc') || 'Joined during beta',
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
        },
        verified: {
            icon: Shield,
            label: t('badgeVerified') || 'Verified',
            description: t('badgeVerifiedDesc') || 'Verified account',
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        top_contributor: {
            icon: Trophy,
            label: t('badgeTopContributor') || 'Top Contributor',
            description: t('badgeTopContributorDesc') || 'High quality contributions',
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
        },
        moderator: {
            icon: Award,
            label: t('badgeModerator') || 'Moderator',
            description: t('badgeModeratorDesc') || 'Community moderator',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
        },
        active_member: {
            icon: Zap,
            label: t('badgeActiveMember') || 'Active Member',
            description: t('badgeActiveMemberDesc') || 'Regularly active',
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
        },
        helpful: {
            icon: Heart,
            label: t('badgeHelpful') || 'Helpful',
            description: t('badgeHelpfulDesc') || 'Helps other users',
            color: 'text-pink-500',
            bgColor: 'bg-pink-500/10',
        },
    };

    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    };

    const pillSizeClasses = {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-1 text-sm gap-1.5',
        lg: 'px-3 py-1.5 text-base gap-2',
    };

    if (!badges || badges.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            <TooltipProvider>
                {badges.map((badgeType) => {
                    const badge = badgeDefinitions[badgeType];
                    if (!badge) return null;

                    const Icon = badge.icon;

                    return (
                        <Tooltip key={badgeType}>
                            <TooltipTrigger asChild>
                                <div
                                    className={`inline-flex items-center rounded-full ${badge.bgColor} ${badge.color} ${pillSizeClasses[size]} font-medium transition-all duration-200 hover:scale-105 cursor-default`}
                                >
                                    <Icon className={sizeClasses[size]} />
                                    <span>{badge.label}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{badge.description}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </TooltipProvider>
        </div>
    );
}

// Helper function to calculate badges based on user data
export function calculateBadges(userProfile: any, stats?: { postsCount: number; commentsCount: number }): BadgeType[] {
    const badges: BadgeType[] = [];

    // Early adopter - joined before 2024
    if (userProfile?.createdAt) {
        const createdDate = userProfile.createdAt.toDate ? userProfile.createdAt.toDate() : new Date(userProfile.createdAt);
        if (createdDate < new Date('2025-01-01')) {
            badges.push('early_adopter');
        }
    }

    // Verified badge
    if (userProfile?.isVerified) {
        badges.push('verified');
    }

    // Moderator badge
    if (userProfile?.isModerator || userProfile?.role === 'moderator' || userProfile?.role === 'admin') {
        badges.push('moderator');
    }

    // Top contributor - more than 50 posts
    if (stats?.postsCount && stats.postsCount >= 50) {
        badges.push('top_contributor');
    }

    // Active member - more than 10 posts
    if (stats?.postsCount && stats.postsCount >= 10) {
        badges.push('active_member');
    }

    // Helpful - more than 100 comments
    if (stats?.commentsCount && stats.commentsCount >= 100) {
        badges.push('helpful');
    }

    return badges;
}
