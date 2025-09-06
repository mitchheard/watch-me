import { Suspense } from 'react';
import AdminNotificationsClient from './AdminNotificationsClient';

export default function AdminNotificationsPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage and view system notifications
          </p>
        </div>
        <a
          href="/admin"
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          Back to Admin
        </a>
      </div>
      
      <Suspense fallback={<div className="text-center py-8">Loading notifications...</div>}>
        <AdminNotificationsClient />
      </Suspense>
    </div>
  );
}
