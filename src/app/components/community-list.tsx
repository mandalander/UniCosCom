'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "./language-provider";
import { communities, type Community } from "@/lib/placeholder-data";

export function CommunityList() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('homeTitle')}</h2>
      {communities && communities.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((community: Community) => (
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
