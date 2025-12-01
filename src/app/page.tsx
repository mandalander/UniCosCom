'use client';
import { useLanguage } from "./components/language-provider";
import { PostFeed } from "./components/post-feed";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto max-w-4xl space-y-12 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-heading">
            <span className="text-gradient">UniCosCom</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('homeDescription')}
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-violet-500 to-indigo-500 mx-auto rounded-full" />
        </div>

        {/* Feed Section */}
        <div className="animate-slide-up">
          <PostFeed />
        </div>
      </div>
    </div>
  );
}
