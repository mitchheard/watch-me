'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { UserCircleIcon, ArrowRightOnRectangleIcon, Cog8ToothIcon } from '@heroicons/react/24/solid';

const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

export default function LayoutShell({ children }: { children: ReactNode }) {
  const { user, logout, loginWithGoogle } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      <header className="sticky top-0 z-[1000] w-full bg-white text-slate-900 shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Watch Me
          </Link>

          <div className="flex items-center gap-2">
            {!user && isHomePage && (
              <button
                onClick={loginWithGoogle}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Get Started
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-label="Open user menu"
                aria-expanded={isMenuOpen}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-[1001]">
                  {user ? (
                    <>
                      {user.email && (
                         <div className="px-4 py-2 text-sm text-slate-700 border-b border-slate-200">
                           <p className="font-medium">Signed in as</p>
                           <p className="truncate">{user.email}</p>
                         </div>
                      )}
                      {user.id === ADMIN_USER_ID && (
                        <Link
                          href="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 w-full text-left"
                        >
                          <Cog8ToothIcon className="h-5 w-5 text-slate-500" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { logout(); setIsMenuOpen(false); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 w-full text-left"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 text-slate-500" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { loginWithGoogle(); setIsMenuOpen(false); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 w-full text-left"
                    >
                      <UserCircleIcon className="h-5 w-5 text-slate-500" />
                      Sign In with Google
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

    </div>
  );
}
