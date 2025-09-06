'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// TODO: Move this to env or a Profile table
const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  notifications: AdminNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminNotificationsClient() {
  const { user, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    type: '',
    isRead: '',
  });
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.id !== ADMIN_USER_ID)) {
      window.location.href = '/';
    }
  }, [user, isLoading]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (filters.type) params.append('type', filters.type);
      if (filters.isRead) params.append('isRead', filters.isRead);

      const response = await fetch(`/api/admin/notifications?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data: NotificationsResponse = await response.json();
      setNotifications(data.notifications);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, isRead: boolean) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, isRead }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, isRead } : notification
        )
      );
    } catch (err) {
      console.error('Error updating notification:', err);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user_activity':
        return 'bg-blue-100 text-blue-800';
      case 'weekly_summary':
        return 'bg-green-100 text-green-800';
      case 'system_alert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const generateReport = async (type: 'weekly' | 'monthly') => {
    try {
      setGeneratingReport(type);
      const response = await fetch(`/api/admin/reports/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${type} report`);
      }

      const result = await response.json();
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated and sent successfully!`);
    } catch (err) {
      console.error(`Error generating ${type} report:`, err);
      alert(`Failed to generate ${type} report: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGeneratingReport(null);
    }
  };

  useEffect(() => {
    if (user && user.id === ADMIN_USER_ID) {
      fetchNotifications();
    }
  }, [user, pagination.page, filters]);

  if (isLoading || loading) {
    return <div className="text-center py-8">Loading notifications...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchNotifications}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reports Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">📊 Generate Reports</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => generateReport('weekly')}
            disabled={generatingReport === 'weekly'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
          >
            {generatingReport === 'weekly' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                📈 Generate Weekly Report
              </>
            )}
          </button>
          <button
            onClick={() => generateReport('monthly')}
            disabled={generatingReport === 'monthly'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
          >
            {generatingReport === 'monthly' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                📊 Generate Monthly Report
              </>
            )}
          </button>
        </div>
        <p className="text-slate-500 text-sm mt-2">
          Reports will be generated and sent via email with detailed analytics and insights.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">🔍 Filter Notifications</h2>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="user_activity">User Activity</option>
              <option value="weekly_summary">Weekly Summary</option>
              <option value="system_alert">System Alert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={filters.isRead}
              onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value }))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg border border-slate-200">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No notifications found
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${!notification.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}
                      >
                        {notification.type.replace('_', ' ')}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <h3 className="font-medium text-slate-900 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-2">
                      {notification.message}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => markAsRead(notification.id, !notification.isRead)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        notification.isRead
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                    >
                      {notification.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} notifications
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-slate-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border border-slate-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
