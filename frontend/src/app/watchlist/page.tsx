'use client';

import WatchlistLibrary from '@/components/watchlist/WatchlistLibrary';
import { useAuth } from '@/contexts/AuthContext';
import SignInScreen from '@/components/app/SignInScreen';

export default function WatchlistPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p className="pt-10 text-center text-muted">Loading…</p>;
  if (!user) return <SignInScreen />;
  return <WatchlistLibrary />;
}
