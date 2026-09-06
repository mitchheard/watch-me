import { Suspense } from 'react';
import AccountScreen from '@/components/account/AccountScreen';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-muted">Loading…</div>}>
      <AccountScreen />
    </Suspense>
  );
}
