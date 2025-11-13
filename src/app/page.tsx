'use client';
import { useLanguage } from "./components/language-provider";
import { PostFeed } from "./components/post-feed";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{t('homeTitle')}</h1>
          <p className="text-muted-foreground">{t('homeDescription')}</p>
        </div>
        <PostFeed />
      </div>
    </div>
  );
}
