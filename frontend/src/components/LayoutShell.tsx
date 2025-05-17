'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

export default function LayoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
            Watch Me
          </Link>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

      <div className="sticky bottom-0 z-50 w-full bg-blue-600 text-white shadow-md md:hidden">
        <div className="container mx-auto px-4 h-16 flex items-center justify-around">
          {/* Placeholder for actual buttons - they will need to be styled for white text too */}
        </div>
      </div>
    </div>
  );
}
