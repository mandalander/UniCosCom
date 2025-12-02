'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "./language-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Community } from '@/lib/types';

export function CommunityList() {
  const { t } = useLanguage();
  const firestore = useFirestore();

  const [limitCount, setLimitCount] = useState(9);

  const communitiesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), orderBy('createdAt', 'desc'), limit(limitCount));
  }, [firestore, limitCount]);

  const { data: communities, isLoading } = useCollection<Community>(communitiesQuery);

  const handleLoadMore = () => {
    setLimitCount(prev => prev + 9);
  };

  if (isLoading && limitCount === 9) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities && communities.length > 0 ? (
          communities.map((community) => (
            <Link href={`/community/${community.id}`} key={community.id} className="block hover:no-underline group">
              <Card className="h-full glass-card border-none hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors">{community.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{community.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">{t('noCommunitiesYet')}</p>
        )}
      </div>

      {communities && communities.length >= limitCount && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? t('loading') : t('loadMore') || "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
