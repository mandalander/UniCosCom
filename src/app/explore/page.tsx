'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "../components/language-provider";
import { CommunityList } from "../components/community-list";

export default function ExplorePage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
       <div className="space-y-4">
          <h1 className="text-3xl font-bold">{t('communitiesTitle')}</h1>
          <p className="text-muted-foreground">{t('exploreDescription')}</p>
        </div>
        <CommunityList />
    </div>
  )
}
