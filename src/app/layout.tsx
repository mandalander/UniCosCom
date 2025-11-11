import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AppSidebar } from './components/app-sidebar';
import { TopNavBar } from './components/top-nav-bar';
import { ThemeProvider } from './components/theme-provider';
import { LanguageProvider } from './components/language-provider';
import { FirebaseClientProvider } from '@/firebase';
import { UserDataSync } from './components/user-data-sync';

export const metadata: Metadata = {
  title: 'Nawigator Aplikacji',
  description: 'Aplikacja z górną i boczną nawigacją.',
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
                  <div className="p-4 sm:p-6 lg:p-8">{children}</div>
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
