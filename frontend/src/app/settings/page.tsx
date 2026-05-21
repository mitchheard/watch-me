import { Suspense } from 'react';
import SettingsClient from './SettingsClient';

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-16 text-center text-slate-600">Loading…</div>
      }
    >
      <SettingsClient />
    </Suspense>
  );
}
