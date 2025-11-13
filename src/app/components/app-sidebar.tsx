'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Compass, PlusCircle } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useLanguage } from './language-provider';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { CreateCommunityDialog } from './create-community-dialog';

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  const allMenuItems = [
    { href: '/', label: t('main'), icon: Home, requiresAuth: false },
    { href: '/explore', label: t('explore'), icon: Compass, requiresAuth: false },
  ];
  
  const settingsMenuItem = { href: '/settings', label: t('settings'), icon: Settings, requiresAuth: false };


  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = allMenuItems.filter(item => {
    if (item.requiresAuth && !user) {
      return false;
    }
    return true;
  });

  if (!mounted) {
    return <Sidebar />;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Button variant="ghost" className="flex items-center gap-2">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
            >
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
            <h2 className="text-lg font-semibold text-sidebar-foreground">{t('appNavigator')}</h2>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
              <CreateCommunityDialog>
                <SidebarMenuButton tooltip={t('createNewCommunity')} disabled={true}>
                  <PlusCircle />
                  <span>{t('createNewCommunity')}</span>
                </SidebarMenuButton>
              </CreateCommunityDialog>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === settingsMenuItem.href}
              tooltip={settingsMenuItem.label}
            >
              <Link href={settingsMenuItem.href}>
                <settingsMenuItem.icon />
                <span>{settingsMenuItem.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
