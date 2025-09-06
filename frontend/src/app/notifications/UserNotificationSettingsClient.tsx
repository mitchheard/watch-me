'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// TODO: Move this to env or a Profile table
const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  welcomeEmailSent: boolean;
  weeklyDigestEnabled: boolean;
  monthlyDigestEnabled: boolean;
  newSeasonAlerts: boolean;
  friendActivityAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UserNotificationSettingsClient() {
  const { user, isLoading } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdmin = user?.id === ADMIN_USER_ID;

  useEffect(() => {
    if (!isLoading && user) {
      fetchPreferences();
    }
  }, [user, isLoading]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/notifications/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      
      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/user/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
      setSuccess('Settings updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof NotificationPreferences) => {
    if (!preferences) return;
    
    const newValue = !preferences[field];
    updatePreferences({ [field]: newValue });
  };

  if (isLoading || loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-slate-500 mt-2">Loading settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">Please sign in to manage your notification preferences.</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load notification preferences</p>
        <button
          onClick={fetchPreferences}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* User Profile Info */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-slate-900">{user.email}</p>
            <p className="text-sm text-slate-500">
              {isAdmin ? 'Administrator' : 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Notifications Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">🔔 Personal Notifications</h2>
        <p className="text-slate-600 text-sm mb-6">
          Manage notifications about your watchlist and activity.
        </p>
        
        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">Email Notifications</h3>
              <p className="text-sm text-slate-600 mt-1">
                Enable or disable all email notifications
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={() => handleToggle('emailEnabled')}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* New Season Alerts */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">New Season Alerts</h3>
              <p className="text-sm text-slate-600 mt-1">
                Get notified when new seasons of your watched shows are available
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.newSeasonAlerts}
                onChange={() => handleToggle('newSeasonAlerts')}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Friend Activity Alerts */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">Friend Activity Alerts</h3>
              <p className="text-sm text-slate-600 mt-1">
                Get notified about your friends' watchlist activity
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.friendActivityAlerts}
                onChange={() => handleToggle('friendActivityAlerts')}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Admin Section - Only visible to admins */}
      {isAdmin && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">👑 Admin Email Reports</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Admin Only
            </span>
          </div>
          <p className="text-slate-600 text-sm mb-6">
            Configure automatic email reports that will be sent to your admin email address.
          </p>
          
          <div className="space-y-4">
            {/* Weekly Digest */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">Weekly Digest</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Automated weekly report sent every Monday at 9:00 AM UTC
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Includes: User activity, popular content, growth metrics
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.weeklyDigestEnabled}
                  onChange={() => handleToggle('weeklyDigestEnabled')}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Monthly Digest */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">Monthly Digest</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Automated monthly report sent on the 1st of each month at 9:00 AM UTC
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Includes: Monthly statistics, user engagement, content trends
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.monthlyDigestEnabled}
                  onChange={() => handleToggle('monthlyDigestEnabled')}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-medium text-slate-900 mb-3">Admin Actions</h3>
            <div className="flex gap-3">
              <a
                href="/admin/notifications"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                📊 View Admin Notifications
              </a>
              <a
                href="/admin"
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                🛠️ Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📅 Schedule Information</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Weekly Reports:</strong> Every Monday at 9:00 AM UTC</p>
          <p><strong>Monthly Reports:</strong> 1st of each month at 9:00 AM UTC</p>
          <p><strong>Timezone:</strong> Reports are sent in UTC time. Adjust for your local timezone.</p>
        </div>
      </div>

      {/* Test Section - Only for admins */}
      {isAdmin && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">🧪 Test Reports</h2>
          <p className="text-slate-600 text-sm mb-4">
            Send test reports to verify your email configuration is working correctly.
          </p>
          
          <div className="flex gap-4">
            <a
              href="/admin/notifications"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Generate Test Weekly Report
            </a>
            <a
              href="/admin/notifications"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Generate Test Monthly Report
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
