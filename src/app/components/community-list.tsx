'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Community = {
  id: string;
  name: string;
  description: string;
  createdAt: any;
};

export function CommunityList() {
  const firestore = useFirestore();

  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: communities, isLoading } = useCollection<Community>(communitiesQuery);
  const showLoading = isLoading || !firestore;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Społeczności</h2>
      {showLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : communities && communities.length > 0 ? (
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
      ) : (
        <p>Nie utworzono jeszcze żadnych społeczności.</p>
      )}
    </div>
  );
}
