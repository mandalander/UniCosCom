'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "./language-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useMemo } from 'react';

type Community = {
  id: string;
  name: string;
  description: string;
  createdAt?: any;
};

export function CommunityList() {
  const { t } = useLanguage();
  const firestore = useFirestore();

  const communitiesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: communities, isLoading } = useCollection<Community>(communitiesQuery);

  if (isLoading) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {communities && communities.length > 0 ? (
          communities.map((community) => (
            <Link href={`/community/${community.id}`} key={community.id} className="block hover:no-underline">
                <Card className="h-full hover:border-primary transition-colors">
                    <CardHeader>
                        <CardTitle>{community.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{community.description}</CardDescription>
                    </CardHeader>
                </Card>
            </Link>
          ))
      ) : (
        <p>{t('noCommunitiesYet')}</p>
      )}
    </div>
  );
}
