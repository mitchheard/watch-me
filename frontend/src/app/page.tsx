'use client';

import { useAuth } from '@/contexts/AuthContext';
import SignInScreen from '@/components/app/SignInScreen';
import TonightHome from '@/components/tonight/TonightHome';

export default function Page() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  return <TonightHome />;
}
