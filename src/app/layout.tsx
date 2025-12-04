import '@/lib/polyfill';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AppSidebar } from './components/app-sidebar';
import { TopNavBar } from './components/top-nav-bar';
import { ThemeProvider } from './components/theme-provider';
import { LanguageProvider } from './components/language-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { UserDataSync } from './components/user-data-sync';
import Script from 'next/script';
import { PageTransition } from './components/page-transition';
import { GoogleAnalytics } from './components/google-analytics';
import { ErrorBoundary } from './components/error-boundary';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: {
    default: 'UniCosCom - Unikalny Kosmos Komunikacji',
    template: '%s | UniCosCom'
  },
  description: 'UniCosCom - Nowoczesna platforma społecznościowa łącząca ludzi, społeczności i idee. Dołącz do nas i odkryj nowe możliwości komunikacji!',
  keywords: ['społeczność', 'komunikacja', 'uniwersytet', 'forum', 'chat', 'networking'],
  authors: [{ name: 'UniCosCom Team' }],
  creator: 'UniCosCom',
  publisher: 'UniCosCom',
  metadataBase: new URL('https://uni-cos-com.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: 'https://uni-cos-com.vercel.app',
    siteName: 'UniCosCom',
    title: 'UniCosCom - Unikalny Kosmos Komunikacji',
    description: 'Nowoczesna platforma społecznościowa łącząca ludzi, społeczności i idee.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UniCosCom',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniCosCom - Unikalny Kosmos Komunikacji',
    description: 'Nowoczesna platforma społecznościowa łącząca ludzi, społeczności i idee.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="UniCosCom" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="icon" href="/icon.png" />
      </head>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7558071569357753"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
        <GoogleAnalytics measurementId="G-XXXXXXXXXX" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <ErrorBoundary>
              <FirebaseClientProvider>
                <UserDataSync />
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset>
                    <TopNavBar />
                    <div className="px-2 py-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem-60px)]">
                      <PageTransition>
                        {children}
                      </PageTransition>
                    </div>
                    <footer className="border-t py-6 md:py-0 glass mt-8">
                      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 sm:px-6 lg:px-8">
                        <p className="text-sm text-muted-foreground text-center md:text-left">
                          &copy; {new Date().getFullYear()} UniCosCom. Wszelkie prawa zastrzeżone.
                        </p>
                        <nav className="flex gap-4 text-sm text-muted-foreground">
                          <Link href="/privacy" className="hover:underline hover:text-foreground transition-colors">
                            Polityka Prywatności
                          </Link>
                          <Link href="/terms" className="hover:underline hover:text-foreground transition-colors">
                            Regulamin
                          </Link>
                        </nav>
                      </div>
                    </footer>
                  </SidebarInset>
                </SidebarProvider>
                <Toaster />
              </FirebaseClientProvider>
            </ErrorBoundary>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
