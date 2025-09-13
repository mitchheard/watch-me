'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// TODO: Move this to env or a Profile table
const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  welcomeEmailSent: boolean;
  weeklyDigestEnabled: boolean;
  monthlyDigestEnabled?: boolean; // Optional in case migration hasn't been applied yet
  newSeasonAlerts: boolean;
  friendActivityAlerts: boolean;
  unsubscribeToken?: string; // Optional in case migration hasn't been applied yet
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
  const hasFetched = useRef(false);

  const isAdmin = user?.id === ADMIN_USER_ID;

  useEffect(() => {
    if (!isLoading && user && !hasFetched.current) {
      hasFetched.current = true;
      fetchPreferences();
    }
  }, [user, isLoading]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/user/notifications/preferences');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch preferences');
      }
      
      const data = await response.json();
      console.log('Preferences data:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPreferences(data.preferences);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notification preferences');
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
            <div className="flex-1 pr-4 min-w-0">
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
            <div className="flex-1 pr-4 min-w-0">
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
            <div className="flex-1 pr-4 min-w-0">
              <h3 className="font-medium text-slate-900">Friend Activity Alerts</h3>
              <p className="text-sm text-slate-600 mt-1">
                Get notified about your friends&apos; watchlist activity
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">👑 Admin Notifications</h2>
          <p className="text-slate-600 text-sm mb-6">
            All email notifications that are sent to your admin email address.
          </p>
          
          <div className="space-y-3">
            {/* New User Signup */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex-1 pr-4 min-w-0">
                <h4 className="font-medium text-slate-900 text-sm mb-1">🎉 New User Signup</h4>
                <p className="text-xs text-slate-600">
                  Sent when a new user registers for the first time
                </p>
              </div>
              <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded flex-shrink-0">Always On</span>
            </div>

            {/* User Added First Item */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1 pr-4 min-w-0">
                <h4 className="font-medium text-slate-900 text-sm mb-1">📝 User Added First Item</h4>
                <p className="text-xs text-slate-600">
                  Sent when a user adds their first item to their watchlist
                </p>
              </div>
              <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded flex-shrink-0">Always On</span>
            </div>

            {/* User Left First Review */}
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex-1 pr-4 min-w-0">
                <h4 className="font-medium text-slate-900 text-sm mb-1">⭐ User Left First Review</h4>
                <p className="text-xs text-slate-600">
                  Sent when a user leaves their first rating or review
                </p>
              </div>
              <span className="text-xs text-yellow-600 font-medium bg-yellow-100 px-2 py-1 rounded flex-shrink-0">Always On</span>
            </div>

            {/* User Repeat Visit */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex-1 pr-4 min-w-0">
                <h4 className="font-medium text-slate-900 text-sm mb-1">🔄 User Repeat Visit</h4>
                <p className="text-xs text-slate-600">
                  Sent when a user visits 3+ times within 7 days
                </p>
              </div>
              <span className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded flex-shrink-0">Always On</span>
            </div>

            {/* User Returned After Inactivity */}
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex-1 pr-4 min-w-0">
                <h4 className="font-medium text-slate-900 text-sm mb-1">🎯 User Returned After Inactivity</h4>
                <p className="text-xs text-slate-600">
                  Sent when a user returns after 7+ days of inactivity
                </p>
              </div>
              <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded flex-shrink-0">Always On</span>
            </div>

            {/* Weekly Digest */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-1 pr-4 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900 text-sm">📊 Weekly Digest</h4>
                  <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded flex-shrink-0">Every Monday 9:00 AM UTC</span>
                </div>
                <p className="text-xs text-slate-600">
                  Automated weekly report including user activity, popular content, and growth metrics
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
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-1 pr-4 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900 text-sm">📈 Monthly Digest</h4>
                  <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded flex-shrink-0">1st of Month 9:00 AM UTC</span>
                </div>
                <p className="text-xs text-slate-600">
                  Automated monthly report including statistics, user engagement, and content trends
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.monthlyDigestEnabled ?? false}
                  onChange={() => handleToggle('monthlyDigestEnabled')}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}


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
