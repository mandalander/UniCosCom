'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Compass, PlusCircle, Users, Pencil } from 'lucide-react';
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

  const allMenuItems = [
    { href: '/', label: t('main'), icon: Home, requiresAuth: false },
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
          <svg width="24" height="24" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="bgGrad" cx="50%" cy="50%">
                <stop offset="0%" style={{stopColor: '#1a0a2e'}} />
                <stop offset="50%" style={{stopColor: '#0f0520'}} />
                <stop offset="100%" style={{stopColor: '#030008'}} />
              </radialGradient>
              <linearGradient id="gradU" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{stopColor: '#00f5ff'}} />
                <stop offset="50%" style={{stopColor: '#00d4ff'}} />
                <stop offset="100%" style={{stopColor: '#4169ff'}} />
              </linearGradient>
              <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{stopColor: '#c466ff'}} />
                <stop offset="50%" style={{stopColor: '#9d4edd'}} />
                <stop offset="100%" style={{stopColor: '#00d4ff'}} />
              </linearGradient>
              <linearGradient id="orbitGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" style={{stopColor: '#00f5ff', stopOpacity: 0.6}} />
                <stop offset="50%" style={{stopColor: '#c466ff', stopOpacity: 0.4}} />
                <stop offset="100%" style={{stopColor: '#00f5ff', stopOpacity: 0.6}} />
              </linearGradient>
              <filter id="neon-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="8" in="SourceGraphic" result="blur1" />
                <feGaussianBlur stdDeviation="20" in="SourceGraphic" result="blur2" />
                <feGaussianBlur stdDeviation="35" in="SourceGraphic" result="blur3" />
                <feMerge>
                  <feMergeNode in="blur3" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="orbit-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" in="SourceGraphic" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="star-glow">
                <feGaussianBlur stdDeviation="1.5" />
              </filter>
              <path id="orbit1" d="M 180,500 A 380,140 0 1,1 820,500 A 380,140 0 1,1 180,500" 
                    transform="rotate(-20 500 500)" fill="none" />
              <path id="orbit2" d="M 80,500 A 420,160 0 1,1 920,500 A 420,160 0 1,1 80,500" 
                    transform="rotate(25 500 500)" fill="none" />
            </defs>
            <rect width="100%" height="100%" fill="url(#bgGrad)" />
            <g opacity="0.7">
              <circle cx="120" cy="150" r="1.5" fill="white" filter="url(#star-glow)" />
              <circle cx="280" cy="80" r="1" fill="white" filter="url(#star-glow)" />
              <circle cx="450" cy="120" r="2" fill="#00d4ff" filter="url(#star-glow)" />
              <circle cx="680" cy="90" r="1.2" fill="white" filter="url(#star-glow)" />
              <circle cx="820" cy="180" r="1.8" fill="#c466ff" filter="url(#star-glow)" />
              <circle cx="900" cy="250" r="1" fill="white" filter="url(#star-glow)" />
              <circle cx="150" cy="350" r="1.3" fill="white" filter="url(#star-glow)" />
              <circle cx="850" cy="420" r="1.5" fill="white" filter="url(#star-glow)" />
              <circle cx="100" cy="650" r="1" fill="#00f5ff" filter="url(#star-glow)" />
              <circle cx="920" cy="700" r="1.6" fill="white" filter="url(#star-glow)" />
              <circle cx="200" cy="850" r="1.2" fill="white" filter="url(#star-glow)" />
              <circle cx="750" cy="880" r="1.4" fill="white" filter="url(#star-glow)" />
              <circle cx="400" cy="920" r="1" fill="white" filter="url(#star-glow)" />
              <circle cx="600" cy="900" r="1.8" fill="#c466ff" filter="url(#star-glow)" />
            </g>
            <g filter="url(#orbit-glow)">
              <ellipse cx="500" cy="500" rx="380" ry="140" 
                       stroke="url(#orbitGrad)" strokeWidth="2" fill="none" 
                       transform="rotate(-20 500 500)" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="4s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="500" cy="500" rx="420" ry="160" 
                       stroke="url(#orbitGrad)" strokeWidth="1.8" fill="none" 
                       transform="rotate(25 500 500)" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.3;0.6" dur="5s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="500" cy="500" rx="360" ry="125" 
                       stroke="url(#orbitGrad)" strokeWidth="1.5" fill="none" 
                       transform="rotate(-5 500 500)" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.25;0.5" dur="6s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="500" cy="500" rx="340" ry="110" 
                       stroke="url(#orbitGrad)" strokeWidth="1.2" fill="none" 
                       transform="rotate(10 500 500)" opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.2;0.4" dur="7s" repeatCount="indefinite" />
              </ellipse>
            </g>
            <g>
              <circle cx="0" cy="0" r="4" fill="#00f5ff" opacity="0.9" filter="url(#star-glow)">
                <animateMotion dur="15s" repeatCount="indefinite">
                  <mpath href="#orbit1" />
                </animateMotion>
              </circle>
              <circle cx="0" cy="0" r="3" fill="#c466ff" opacity="0.8" filter="url(#star-glow)">
                <animateMotion dur="20s" repeatCount="indefinite">
                  <mpath href="#orbit2" />
                </animateMotion>
              </circle>
            </g>
            <g filter="url(#neon-glow)">
              <text x="360" y="660" 
                    fontFamily="'Arial Black', 'Arial Bold', sans-serif" 
                    fontSize="480" 
                    fontWeight="900" 
                    letterSpacing="-80" 
                    textAnchor="middle" 
                    fill="url(#gradU)">U</text>
              <text x="640" y="660" 
                    fontFamily="'Arial Black', 'Arial Bold', sans-serif" 
                    fontSize="480" 
                    fontWeight="900" 
                    letterSpacing="-80" 
                    textAnchor="middle" 
                    fill="url(#gradC)">C</text>
            </g>
            <g opacity="0.9">
              <text x="360" y="660" 
                    fontFamily="'Arial Black', 'Arial Bold', sans-serif" 
                    fontSize="480" 
                    fontWeight="900" 
                    letterSpacing="-80" 
                    textAnchor="middle" 
                    fill="none" 
                    stroke="#66ffff" 
                    strokeWidth="3">U</text>
              <text x="640" y="660" 
                    fontFamily="'Arial Black', 'Arial Bold', sans-serif" 
                    fontSize="480" 
                    fontWeight="900" 
                    letterSpacing="-80" 
                    textAnchor="middle" 
                    fill="none" 
                    stroke="#dd88ff" 
                    strokeWidth="3">C</text>
            </g>
            <circle cx="500" cy="500" r="50" fill="#c466ff" opacity="0.1">
              <animate attributeName="r" values="50;80;50" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.1;0.02;0.1" dur="3s" repeatCount="indefinite" />
            </circle>
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
        <SidebarGroup>
            <SidebarGroupLabel asChild>
                <Link href="/explore"><Users /> <span>{t('communitiesTitle')}</span></Link>
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenuSub>
                    {isLoadingCommunities ? (
                        <>
                            <SidebarMenuSkeleton showIcon={false} />
                            <SidebarMenuSkeleton showIcon={false} />
                        </>
                    ) : communities && communities.length > 0 ? (
                        communities.map((community) => (
                            <SidebarMenuSubButton key={community.id} asChild isActive={pathname === `/community/${community.id}`}>
                                <Link href={`/community/${community.id}`}>{community.name}</Link>
                            </SidebarMenuSubButton>
                        ))
                    ) : (
                        <p className="px-2 text-xs text-sidebar-foreground/70">{t('noCommunitiesYet')}</p>
                    )}
                </SidebarMenuSub>
            </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <CreatePostDialog communities={communities || []}>
              <SidebarMenuButton tooltip={t('createNewPost')}>
                <Pencil />
                <span>{t('createNewPost')}</span>
              </SidebarMenuButton>
            </CreatePostDialog>
          </SidebarMenuItem>
          <SidebarMenuItem>
              <CreateCommunityDialog>
                <SidebarMenuButton tooltip={t('createNewCommunity')}>
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
