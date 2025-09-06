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

export default function AdminNotificationSettingsClient() {
  const { user, isLoading } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.id !== ADMIN_USER_ID)) {
      window.location.href = '/';
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (user && user.id === ADMIN_USER_ID) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notifications/preferences');
      
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

      const response = await fetch('/api/admin/notifications/preferences', {
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

      {/* Admin Notifications Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">📧 Admin Notifications</h2>
        <p className="text-slate-600 text-sm mb-6">
          All email notifications that are sent to your admin email address.
        </p>
        
        <div className="space-y-3">
          {/* New User Signup */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-900 text-sm">🎉 New User Signup</h4>
                <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">Always On</span>
              </div>
              <p className="text-xs text-slate-600">
                Sent when a new user registers for the first time
              </p>
            </div>
          </div>

          {/* User Added First Item */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-900 text-sm">📝 User Added First Item</h4>
                <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">Always On</span>
              </div>
              <p className="text-xs text-slate-600">
                Sent when a user adds their first item to their watchlist
              </p>
            </div>
          </div>

          {/* User Left First Review */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-900 text-sm">⭐ User Left First Review</h4>
                <span className="text-xs text-yellow-600 font-medium bg-yellow-100 px-2 py-1 rounded">Always On</span>
              </div>
              <p className="text-xs text-slate-600">
                Sent when a user leaves their first rating or review
              </p>
            </div>
          </div>

          {/* User Repeat Visit */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-900 text-sm">🔄 User Repeat Visit</h4>
                <span className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded">Always On</span>
              </div>
              <p className="text-xs text-slate-600">
                Sent when a user visits 3+ times within 7 days
              </p>
            </div>
          </div>

          {/* User Returned After Inactivity */}
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-900 text-sm">🎯 User Returned After Inactivity</h4>
                <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded">Always On</span>
              </div>
              <p className="text-xs text-slate-600">
                Sent when a user returns after 7+ days of inactivity
              </p>
            </div>
          </div>

          {/* Weekly Digest */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-900 text-sm">📊 Weekly Digest</h4>
                <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded">Every Monday 9:00 AM UTC</span>
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
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-900 text-sm">📈 Monthly Digest</h4>
                <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded">1st of Month 9:00 AM UTC</span>
              </div>
              <p className="text-xs text-slate-600">
                Automated monthly report including statistics, user engagement, and content trends
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
      </div>

      {/* User Notifications Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">🔔 User Notifications</h2>
        <p className="text-slate-600 text-sm mb-6">
          Configure notification preferences for all users in the system.
        </p>
        
        <div className="space-y-4">
          {/* New Season Alerts */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">New Season Alerts</h3>
              <p className="text-sm text-slate-600 mt-1">
                Notify users when new seasons of their watched shows are available
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
                Notify users about their friends&apos; watchlist activity
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


      {/* Test Buttons */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">🧪 Test Reports</h2>
        <p className="text-slate-600 text-sm mb-4">
          Send test reports to verify your email configuration is working correctly.
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={() => window.open('/admin/notifications', '_blank')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Generate Test Weekly Report
          </button>
          <button
            onClick={() => window.open('/admin/notifications', '_blank')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Generate Test Monthly Report
          </button>
        </div>
      </div>
    </div>
  );
}
