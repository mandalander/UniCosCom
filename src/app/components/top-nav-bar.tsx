'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLanguage } from './language-provider';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User as UserIcon } from 'lucide-react';
import { NotificationBell } from './notification-bell';
import { SearchBar } from './search-bar';
import { ThemeToggle } from './theme-toggle';

export function TopNavBar() {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return <UserIcon className="h-5 w-5" />;
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between glass px-4 sm:px-6 mb-4 rounded-b-xl mx-2 mt-2">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        <SearchBar />
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {isUserLoading ? (
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
        ) : user ? (
          <>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? user.email ?? 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user.displayName, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">{t('profile')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-communities">{t('myCommunities')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/saved">{t('savedPosts')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:scale-105 text-sm px-3 py-1 whitespace-nowrap">
            <Link href="/login">{t('login')}</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
