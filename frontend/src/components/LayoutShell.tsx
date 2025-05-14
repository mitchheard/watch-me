'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { HomeIcon, PlusIcon, CogIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Header: Retaining white background for separation, updating border */}
      {/* "Tailwind is working" div removed */}
      <header className="p-4 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-slate-900">🎬 Watch Me</h1>
      </header>

      <main className="flex-1 px-4 sm:px-6 md:px-8 max-w-3xl w-full mx-auto py-6">
        {children}
      </main>

      {/* Bottom nav (mobile only): Retaining white background, updating border */}
      <nav className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white sm:hidden flex justify-around py-2">
        <NavLink href="/" isActive={pathname === '/'} icon={<HomeIcon className="w-5 h-5" />} label="Home" />
        <NavLink href="/add" isActive={pathname === '/add'} icon={<PlusIcon className="w-5 h-5" />} label="Add" />
        <NavLink href="/settings" isActive={pathname === '/settings'} icon={<CogIcon className="w-5 h-5" />} label="Settings" />
      </nav>
    </div>
  );
}

function NavLink({
  href,
  isActive,
  icon,
  label,
}: {
  href: string;
  isActive: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
        isActive
          ? 'text-blue-600' // Active link color
          : 'text-slate-500 hover:text-slate-700' // Inactive link color
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
