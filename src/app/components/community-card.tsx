'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, TrendingUp } from 'lucide-react';

type Community = {
    id: string;
    name: string;
    description: string;
    createdAt?: any;
    memberCount?: number;
};

interface CommunityCardProps {
    community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
    const firestore = useFirestore();

    // Real-time member count from Firebase
    const membersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'communities', community.id, 'members'));
    }, [firestore, community.id]);

    const { data: members } = useCollection(membersQuery);
    const memberCount = members?.length || community.memberCount || 0;

    return (
        <Link href={`/community/${community.id}`} className="block hover:no-underline group h-full">
            <Card className="h-full glass-card border-none hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-purple-500/60 to-pink-500/60"></div>

                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="group-hover:text-primary transition-colors text-lg">
                            {community.name}
                        </CardTitle>
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <CardDescription className="line-clamp-2 text-sm">
                        {community.description}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 pb-4">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{memberCount.toLocaleString()}</span>
                            <span>{memberCount === 1 ? 'członek' : 'członków'}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
