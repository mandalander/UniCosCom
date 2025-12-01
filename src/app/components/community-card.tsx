'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Community = {
    id: string;
    name: string;
    description: string;
    createdAt?: any;
};

interface CommunityCardProps {
    community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
    return (
        <Link href={`/community/${community.id}`} className="block hover:no-underline group h-full">
            <Card className="h-full glass-card border-none hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <CardHeader>
                    <CardTitle className="group-hover:text-primary transition-colors">{community.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{community.description}</CardDescription>
                </CardHeader>
            </Card>
        </Link>
    );
}
