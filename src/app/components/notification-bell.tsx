'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
  updateDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { useLanguage } from './language-provider';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

type Notification = {
  id: string;
  actorDisplayName: string;
  targetType: 'post' | 'comment';
  targetTitle: string;
  communityId: string;
  postId: string;
  createdAt: any;
  read: boolean;
};

export function NotificationBell() {
  const { t, language } = useLanguage();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'userProfiles', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [user, firestore]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0 && firestore && user) {
      // Mark all visible notifications as read
      const batch = writeBatch(firestore);
      notifications?.forEach((n) => {
        if (!n.read) {
          const notifRef = doc(firestore, 'userProfiles', user.uid, 'notifications', n.id);
          batch.update(notifRef, { read: true });
        }
      });
      batch.commit().catch(console.error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: language === 'pl' ? pl : enUS,
    });
  };

  const renderNotificationText = (notification: Notification) => {
    const key =
      notification.targetType === 'post'
        ? 'userUpvotedYourPost'
        : 'userUpvotedYourComment';
    return t(key, {
      username: notification.actorDisplayName,
      postTitle: notification.targetTitle,
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 hover:animate-shake transition-all">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">{t('notifications')}</h4>
          </div>
          <div className="grid gap-1">
            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={`/community/${notification.communityId}/post/${notification.postId}`}
                  className="block"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="p-2 rounded-md hover:bg-accent text-sm">
                    <p className={!notification.read ? 'font-semibold' : ''}>
                      {renderNotificationText(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground p-4 text-center">
                {t('noNotifications')}
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

