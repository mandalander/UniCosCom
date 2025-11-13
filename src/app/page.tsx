'use client';
import { CommunityList } from "./components/community-list";
import { useLanguage } from "./components/language-provider";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{t('homeTitle')}</h1>
          <p className="text-muted-foreground">{t('homeDescription')}</p>
        </div>
        <CommunityList />
      </div>
    </div>
  );
}
