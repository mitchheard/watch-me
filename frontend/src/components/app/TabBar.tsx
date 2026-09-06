'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  FilmIcon,
  PlusIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';
import {
  HomeIcon as HomeOutline,
  FilmIcon as FilmOutline,
  UserCircleIcon as UserOutline,
} from '@heroicons/react/24/outline';

const TABS = [
  { href: '/', label: 'Tonight', id: 'tonight' },
  { href: '/watchlist', label: 'Watchlist', id: 'watchlist' },
  { href: '/add', label: 'Add', id: 'add' },
  { href: '/account', label: 'Account', id: 'account' },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 pointer-events-none"
      aria-label="Main"
    >
      <div className="h-8 bg-gradient-to-t from-canvas to-transparent" />
      <div className="pointer-events-auto bg-canvas/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-4 max-w-lg mx-auto">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            const Icon =
              tab.id === 'tonight'
                ? active
                  ? HomeIcon
                  : HomeOutline
                : tab.id === 'watchlist'
                  ? active
                    ? FilmIcon
                    : FilmOutline
                  : tab.id === 'account'
                    ? active
                      ? UserCircleIcon
                      : UserOutline
                    : PlusIcon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                    active ? 'text-accent' : 'text-muted'
                  }`}
                >
                  {tab.id === 'add' ? (
                    <span className="h-8 w-8 rounded-full bg-accent text-accent-ink flex items-center justify-center -mt-1">
                      <PlusIcon className="h-5 w-5" />
                    </span>
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
