import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AppSidebar } from './components/app-sidebar';
import { TopNavBar } from './components/top-nav-bar';
import { ThemeProvider } from './components/theme-provider';
import { LanguageProvider } from './components/language-provider';
import { FirebaseClientProvider } from '@/firebase';
import { UserDataSync } from './components/user-data-sync';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Unicoscom',
  description: 'Unicoscom - Unikalny Kosmos Komunikacji i Społeczności.',
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_TOKEN",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7558071569357753" crossOrigin="anonymous" strategy="lazyOnload" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <FirebaseClientProvider>
              <UserDataSync />
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <TopNavBar />
                  <div className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem-60px)]">{children}</div>
                  <footer className="border-t py-6 md:py-0">
                    <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 sm:px-6 lg:px-8">
                      <p className="text-sm text-muted-foreground text-center md:text-left">
                        &copy; {new Date().getFullYear()} UniCosCom. Wszelkie prawa zastrzeżone.
                      </p>
                      <nav className="flex gap-4 text-sm text-muted-foreground">
                        <Link href="/privacy" className="hover:underline hover:text-foreground">
                          Polityka Prywatności
                        </Link>
                        <Link href="/terms" className="hover:underline hover:text-foreground">
                          Regulamin
                        </Link>
                      </nav>
                    </div>
                  </footer>
                </SidebarInset>
              </SidebarProvider>
              <Toaster />
            </FirebaseClientProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
