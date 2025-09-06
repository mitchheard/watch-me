import { Suspense } from 'react';
import UnsubscribeClient from './UnsubscribeClient';

export default function UnsubscribePage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Email Preferences</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your email notification preferences
        </p>
      </div>
      
      <Suspense fallback={<div className="text-center py-8">Loading preferences...</div>}>
        <UnsubscribeClient />
      </Suspense>
    </div>
  );
}
