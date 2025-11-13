'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "./language-provider";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

type Community = {
  id: string;
  name: string;
  description: string;
  createdAt?: any;
};

export function CommunityList() {
  const { t } = useLanguage();
  const firestore = useFirestore();

  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: communities, isLoading } = useCollection<Community>(communitiesQuery);

  if (isLoading) {
    return (
       <div className="space-y-4">
        <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{t('communitiesTitle')}</h2>
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
            <h2 className="text-2xl font-bold">{t('communitiesTitle')}</h2>
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
        <p>{t('noCommunitiesYet')}</p>
      )}
    </div>
  );
}
