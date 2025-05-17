'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LayoutShell({ children }: { children: ReactNode }) {
  const { user, logout, loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-white text-slate-900 shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Watch Me
          </Link>
          {user ? (
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={loginWithGoogle}
              aria-label="Sign In"
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

    </div>
  );
}
