'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Compass, PlusCircle, Users, Pencil, Bell, Bookmark } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSkeleton
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useLanguage } from './language-provider';
import { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { CreateCommunityDialog } from './create-community-dialog';
import { collection, query, orderBy } from 'firebase/firestore';
import { CreatePostDialog } from './create-post-dialog';
import { AdBanner } from './ad-banner';

type Community = {
  id: string;
  name: string;
};

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const communitiesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communities'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: communities, isLoading: isLoadingCommunities } = useCollection<Community>(communitiesQuery);



  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [isLoadingJoinedCommunities, setIsLoadingJoinedCommunities] = useState(true);

  // Let's use useCollection for memberships too
  const membershipsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'communityMemberships'), orderBy('joinedAt', 'desc'));
  }, [user, firestore]);

  const { data: memberships, isLoading: isLoadingMemberships } = useCollection<{ communityName: string }>(membershipsQuery);

  useEffect(() => {
    if (memberships) {
      // Map memberships to Community objects (we only have name and ID from the doc ID)
      const joined = memberships.map(m => ({
        id: m.id,
        name: m.communityName
      }));
      setJoinedCommunities(joined);
      setIsLoadingJoinedCommunities(false);
    } else if (!isLoadingMemberships) {
      setJoinedCommunities([]);
      setIsLoadingJoinedCommunities(false);
    }
  }, [memberships, isLoadingMemberships]);

  const allMenuItems = [
    { href: '/', label: t('main'), icon: Home, requiresAuth: false },
    { href: '/notifications', label: t('notificationsTitle') || "Powiadomienia", icon: Bell, requiresAuth: true },
    { href: '/saved', label: t('savedPosts') || "Saved Posts", icon: Bookmark, requiresAuth: true },
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
    <Sidebar className="border-r-0" collapsible="icon">
      <SidebarHeader className="glass border-b border-white/10 mb-2">
        <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/10 transition-colors">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold">U</div>
          </div>
          <h2 className="text-lg font-semibold text-foreground group-data-[collapsible=icon]:hidden">{t('appNavigator')}</h2>
        </Button>
      </SidebarHeader>
      <SidebarContent className="glass">
        <SidebarMenu className="px-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
                className={`transition-all duration-300 ${pathname === item.href ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-primary border-l-2 border-primary' : 'hover:bg-white/5'}`}
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <Link href="/explore" className="group flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <Users className="h-4 w-4 group-hover:text-primary transition-colors" />
              <span>{t('myCommunities') || "My Communities"}</span>
            </Link>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuSub>
              {isLoadingJoinedCommunities ? (
                <>
                  <SidebarMenuSkeleton showIcon={false} />
                  <SidebarMenuSkeleton showIcon={false} />
                </>
              ) : joinedCommunities && joinedCommunities.length > 0 ? (
                joinedCommunities.map((community) => (
                  <SidebarMenuSubButton key={community.id} asChild isActive={pathname === `/community/${community.id}`} className="hover:bg-white/5 transition-colors">
                    <Link href={`/community/${community.id}`}>
                      <span className={pathname === `/community/${community.id}` ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        {community.name}
                      </span>
                    </Link>
                  </SidebarMenuSubButton>
                ))
              ) : (
                <p className="px-2 text-xs text-muted-foreground/70">{t('noCommunitiesYet')}</p>
              )}
            </SidebarMenuSub>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <span className="px-2 py-1.5 text-sm font-medium text-muted-foreground">{t('communitiesTitle')}</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuSub>
              {isLoadingCommunities ? (
                <SidebarMenuSkeleton showIcon={false} />
              ) : communities && communities.length > 0 ? (
                communities.slice(0, 5).map((community) => (
                  <SidebarMenuSubButton key={community.id} asChild isActive={pathname === `/community/${community.id}`} className="hover:bg-white/5 transition-colors">
                    <Link href={`/community/${community.id}`}>
                      <span className={pathname === `/community/${community.id}` ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        {community.name}
                      </span>
                    </Link>
                  </SidebarMenuSubButton>
                ))
              ) : null}
              <SidebarMenuSubButton asChild>
                <Link href="/explore" className="text-xs text-muted-foreground hover:text-primary">
                  {t('loadMore') || "See all"}
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSub>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <AdBanner dataAdSlot="0987654321" dataAdFormat="rectangle" className="mx-2" />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="glass border-t border-white/10 mt-auto p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <CreatePostDialog communities={communities || []}>
              <SidebarMenuButton tooltip={t('createNewPost')} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20 transition-all duration-300 hover:scale-105 justify-center">
                <Pencil className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">{t('createNewPost')}</span>
              </SidebarMenuButton>
            </CreatePostDialog>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <CreateCommunityDialog>
              <SidebarMenuButton tooltip={t('createNewCommunity')} className="border border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all">
                <PlusCircle className="h-4 w-4 text-primary" />
                <span>{t('createNewCommunity')}</span>
              </SidebarMenuButton>
            </CreateCommunityDialog>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <SidebarMenuButton
              asChild
              isActive={pathname === settingsMenuItem.href}
              tooltip={settingsMenuItem.label}
              className="hover:bg-white/5"
            >
              <Link href={settingsMenuItem.href}>
                <settingsMenuItem.icon className="h-5 w-5 text-muted-foreground" />
                <span>{settingsMenuItem.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
