'use client';
import { useLanguage } from "./components/language-provider";
import { PostFeed } from "./components/post-feed";
import { AdBanner } from "./components/ad-banner";
import { UniCosComLogo } from "./components/unicoscom-logo";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto space-y-12 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 animate-fade-in flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full animate-pulse-slow" />
            <UniCosComLogo className="w-32 h-32 md:w-40 md:h-40 relative z-10" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-heading">
            <span className="text-gradient">UniCosCom</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('homeDescription')}
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 mx-auto rounded-full" />
        </div>

        {/* Ad Banner */}
        <div className="animate-fade-in delay-200">
          <AdBanner dataAdSlot="1234567890" dataAdFormat="rectangle" dataFullWidthResponsive={true} />
        </div>

        {/* Feed Section */}
        <div className="animate-slide-up">
          <PostFeed />
        </div>
      </div>
    </div>
  );
}
