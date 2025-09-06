import { Suspense } from 'react';
import AdminNotificationSettingsClient from './AdminNotificationSettingsClient';

export default function AdminNotificationSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notification Settings</h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure automatic email reports and notifications
          </p>
        </div>
        <a
          href="/admin/notifications"
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          Back to Notifications
        </a>
      </div>
      
      <Suspense fallback={<div className="text-center py-8">Loading settings...</div>}>
        <AdminNotificationSettingsClient />
      </Suspense>
    </div>
  );
}
