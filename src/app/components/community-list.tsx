'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "./language-provider";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Community } from "@/lib/placeholder-data";

export function CommunityList() {
  const { t } = useLanguage();
  const firestore = useFirestore();

  const communitiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'communities'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: communities, isLoading, error } = useCollection<Community>(communitiesQuery);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('homeTitle')}</h2>
      {isLoading && (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="h-6 w-1/2 bg-muted animate-pulse rounded-md" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
                        <div className="h-4 w-3/4 mt-2 bg-muted animate-pulse rounded-md" />
                    </CardContent>
                </Card>
            ))}
         </div>
      )}
      {!isLoading && !error && communities && communities.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <Card key={community.id}>
              <CardHeader>
                <CardTitle>{community.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{community.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !isLoading && !error ? (
        <p>Nie utworzono jeszcze żadnych społeczności.</p>
      ) : null}
       {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">Could not load communities. The security rules may be misconfigured.</p>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
