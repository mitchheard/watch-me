'use client';

import AddTitleSearch from '@/components/watchlist/AddTitleSearch';
import { useAuth } from '@/contexts/AuthContext';
import SignInScreen from '@/components/app/SignInScreen';

export default function AddPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p className="pt-10 text-center text-muted">Loading…</p>;
  if (!user) return <SignInScreen />;
  return <AddTitleSearch />;
}
