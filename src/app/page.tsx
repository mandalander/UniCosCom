'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "./components/language-provider";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const CommunityList = dynamic(
  () => import('./components/community-list').then(mod => mod.CommunityList),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Społeczności</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-4/5" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
);

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">{t('homeTitle')}</CardTitle>
          <CardDescription>
            {t('homeDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            {t('homeContent1')}
          </p>
        </CardContent>
      </Card>
      <CommunityList />
    </div>
  );
}
