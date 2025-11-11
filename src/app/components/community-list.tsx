'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "./language-provider";
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Community } from "@/lib/placeholder-data";
import { Skeleton } from '@/components/ui/skeleton';

export function CommunityList() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  const communitiesQuery = useMemoFirebase(
    () => {
      // Wykonaj zapytanie tylko wtedy, gdy ładowanie użytkownika jest zakończone i instancja firestore jest dostępna
      if (isUserLoading || !firestore) {
        return null;
      }
      return query(collection(firestore, 'communities'), orderBy('createdAt', 'desc'));
    },
    [firestore, isUserLoading]
  );

  const { data: communities, isLoading, error } = useCollection<Community>(communitiesQuery);

  const shouldShowLoading = isLoading || isUserLoading;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('homeTitle')}</h2>
      {shouldShowLoading && (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-3/4 mt-2" />
                    </CardContent>
                </Card>
            ))}
         </div>
      )}
      {!shouldShowLoading && !error && communities && communities.length > 0 ? (
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
      ) : !shouldShowLoading && !error ? (
        <p>Nie utworzono jeszcze żadnych społeczności.</p>
      ) : null}
       {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Błąd</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">Nie można załadować społeczności. Reguły bezpieczeństwa mogą być błędnie skonfigurowane.</p>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
