'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  welcomeEmailSent: boolean;
  weeklyDigestEnabled: boolean;
  monthlyDigestEnabled?: boolean;
  newSeasonAlerts: boolean;
  friendActivityAlerts: boolean;
  unsubscribeToken?: string; // Optional in case migration hasn't been applied yet
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
  };
}

export default function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchPreferences();
    } else {
      setError('Invalid unsubscribe link. Please check your email for the correct link.');
      setLoading(false);
    }
  }, [token, fetchPreferences]);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/unsubscribe/preferences?token=${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      
      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError('Failed to load notification preferences. The unsubscribe link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/unsubscribe/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
      setSuccess('Your preferences have been updated successfully!');
      
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

  const unsubscribeAll = () => {
    if (!preferences) return;
    updatePreferences({ 
      emailEnabled: false,
      weeklyDigestEnabled: false,
      monthlyDigestEnabled: false,
      newSeasonAlerts: false,
      friendActivityAlerts: false
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-slate-500 mt-2">Loading preferences...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Watch Me
          </Link>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">No preferences found.</p>
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

      {/* User Info */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {preferences.user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-slate-900">{preferences.user.email}</p>
            <p className="text-sm text-slate-500">Email notification preferences</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex gap-3">
          <button
            onClick={unsubscribeAll}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Unsubscribe from All Emails
          </button>
          <a
            href="/notifications"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Manage All Settings
          </a>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">📧 Email Notifications</h2>
        <p className="text-slate-600 text-sm mb-6">
          Choose which types of emails you&apos;d like to receive from Watch Me.
        </p>
        
        <div className="space-y-4">
          {/* Master Email Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">All Email Notifications</h3>
              <p className="text-sm text-slate-600 mt-1">
                Master switch for all email notifications
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

          {/* Weekly Digest */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">Weekly Digest</h3>
              <p className="text-sm text-slate-600 mt-1">
                Weekly summary of your watchlist activity
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
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">Monthly Digest</h3>
              <p className="text-sm text-slate-600 mt-1">
                Monthly summary of your watchlist activity
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

      {/* Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ About These Settings</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Changes are saved automatically</p>
          <p>• You can update these settings anytime by visiting your notification preferences</p>
          <p>• Unsubscribing from all emails will disable all notifications</p>
          <p>• You can always resubscribe by visiting the app</p>
        </div>
      </div>
    </div>
  );
}
