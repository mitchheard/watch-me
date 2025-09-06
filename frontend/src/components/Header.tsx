'use client';

import { AuthButton } from './AuthButton';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// TODO: Move this to env or a Profile table
const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const showAuthButton = pathname !== '/_not-found';
  const isAdmin = user?.id === ADMIN_USER_ID;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold">Watch Me</h1>
          {showAuthButton && user && (
            <nav className="hidden md:flex items-center gap-4">
              <a
                href="/"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Watchlist
              </a>
              <a
                href="/recommendations"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/recommendations' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Recommendations
              </a>
              <a
                href="/notifications"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/notifications' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Notifications
              </a>
              {isAdmin && (
                <a
                  href="/admin"
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin') ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin
                </a>
              )}
            </nav>
          )}
        </div>
        {showAuthButton && <AuthButton />}
      </div>
    </header>
  );
} 