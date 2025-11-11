import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function TopNavBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-sidebar px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-4">
        <Button asChild variant="default">
          <Link href="/login">Zaloguj się</Link>
        </Button>
      </div>
    </header>
  );
}
