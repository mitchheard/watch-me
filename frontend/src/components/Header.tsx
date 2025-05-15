'use client';

import { AuthButton } from './AuthButton';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const showAuthButton = pathname !== '/_not-found';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="container flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-bold">Watch Me</h1>
        {showAuthButton && <AuthButton />}
      </div>
    </header>
  );
} 