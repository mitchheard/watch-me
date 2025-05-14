'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { HomeIcon, PlusIcon, CogIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="text-xl font-bold">Watch Me</div>
          {/* Navigation items can go here if needed */}
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation for controls like Add New - more prominent on mobile */}
      <div className="sticky bottom-0 z-50 w-full bg-blue-600 text-white shadow-md md:hidden">
        <div className="container mx-auto px-4 h-16 flex items-center justify-around">
          {/* Placeholder for actual buttons - they will need to be styled for white text too */}
        </div>
      </div>
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
          ? 'text-white font-semibold' // Active link on blue background
          : 'text-blue-100 hover:text-white' // Inactive link on blue background
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
