'use client';

import { useRecentPosts } from '@/hooks/use-recent-posts';
import { useLanguage } from '@/app/components/language-provider';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import Link from 'next/link';

export default function RecentsPage() {
    const { recentPosts, isLoaded } = useRecentPosts();
    const { t } = useLanguage();

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Clock className="h-8 w-8" />
                    {t('Ostatnio') || "Recently Viewed"}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t('recentlyViewedPosts') || "Here are the posts you've recently viewed."}
                </p>
            </div>

            {isLoaded ? (
                recentPosts.length > 0 ? (
                    <div className="space-y-4">
                        {recentPosts.map(post => (
                            <Link key={post.id} href={`/community/${post.communityId}/post/${post.id}`} className="block">
                                <Card className="hover:bg-muted/50 transition-colors">
                                    <CardHeader>
                                        <CardTitle className="text-lg">{post.title}</CardTitle>
                                        <CardDescription>
                                            {t('postedTo') || "in"} {post.communityName}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>{t('noRecentPosts') || "You haven't viewed any posts recently."}</p>
                    </div>
                )
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>{t('loading') || "Loading..."}</p>
                </div>
            )}
        </div>
    );
}
