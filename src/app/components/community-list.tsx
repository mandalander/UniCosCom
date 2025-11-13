'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "./language-provider";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { communities as placeholderCommunities } from '@/lib/placeholder-data';
import { useState, useEffect } from "react";

type Community = {
  id: string;
  name: string;
  description: string;
  createdAt?: any;
};

export function CommunityList() {
  const { t } = useLanguage();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      setCommunities(placeholderCommunities);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
       <div className="space-y-4">
        <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Społeczności</h2>
            <Skeleton className="h-6 w-12" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
       <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Społeczności</h2>
            {communities && <span className="text-2xl font-bold text-muted-foreground">({communities.length})</span>}
      </div>
      {communities && communities.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <Link key={community.id} href={`/community/${community.id}`} passHref>
              <Card className="h-full cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <CardTitle>{community.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">{community.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p>Nie utworzono jeszcze żadnych społeczności.</p>
      )}
    </div>
  );
}
