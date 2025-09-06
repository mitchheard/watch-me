import { Suspense } from 'react';
import UserNotificationSettingsClient from './UserNotificationSettingsClient';

export default function UserNotificationSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notification Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your email notifications and preferences
        </p>
      </div>
      
      <Suspense fallback={<div className="text-center py-8">Loading settings...</div>}>
        <UserNotificationSettingsClient />
      </Suspense>
    </div>
  );
}
