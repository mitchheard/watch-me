'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import TabBar from '@/components/app/TabBar';

const LEGAL_PREFIXES = ['/privacy', '/terms', '/unsubscribe'];

function isLegal(pathname: string) {
  return LEGAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAppPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/watchlist') ||
    pathname.startsWith('/add') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/recommendations')
  );
}

export default function LayoutShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const legal = isLegal(pathname);
  const admin = pathname.startsWith('/admin');
  const showTabs = Boolean(user) && isAppPath(pathname) && !admin && !legal;

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-canvas text-ink flex items-center justify-center">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (admin) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold text-slate-800">
              Watch Me
            </Link>
            <Link href="/account" className="text-sm text-slate-600">
              Account
            </Link>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 pt-2">{children}</main>
      </div>
    );
  }

  if (legal) {
    return <div className="min-h-[100dvh] bg-[#f4efe6] text-[#1a1714]">{children}</div>;
  }

  if (!user) {
    return <div className="min-h-[100dvh] bg-canvas">{children}</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink flex flex-col">
      <main className="flex-grow">{children}</main>
      {showTabs ? <TabBar /> : null}
    </div>
  );
}
