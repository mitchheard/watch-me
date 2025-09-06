"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// TODO: Move this to env or a Profile table
const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Signup Date' },
  { value: 'lastSignInAt', label: 'Last Login' },
  { value: 'lastItemAddedAt', label: 'Last Item Added' },
  { value: 'itemCount', label: 'Total Items' },
  { value: 'sessionCount', label: 'Sessions' },
];

type AdminUser = {
  id: string;
  email: string;
  itemCount: number;
  lastSignInAt?: string | null;
  createdAt?: string | null;
  sessionCount: number;
  lastItemAddedAt?: string | null;
};

export default function AdminPageClient() {
  const { user, isLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('lastItemAddedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!user || user.id !== ADMIN_USER_ID) return;
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setUsers(data);
        setLoading(false);
      })
      .catch(_err => {
        setError('Failed to fetch users');
        setLoading(false);
      });
  }, [user]);

  if (isLoading) return <div className="text-center py-10">Loading...</div>;
  if (!user || user.id !== ADMIN_USER_ID) {
    return <div className="text-center py-10 text-red-600 font-semibold">Forbidden: Admins only</div>;
  }

  // Sort users array
  const sortedUsers = [...users].sort((a, b) => {
    let aVal: number | string | null | undefined;
    let bVal: number | string | null | undefined;
    switch (sortBy) {
      case 'createdAt':
        aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        break;
      case 'lastSignInAt':
        aVal = a.lastSignInAt ? new Date(a.lastSignInAt).getTime() : 0;
        bVal = b.lastSignInAt ? new Date(b.lastSignInAt).getTime() : 0;
        break;
      case 'lastItemAddedAt':
        aVal = a.lastItemAddedAt ? new Date(a.lastItemAddedAt).getTime() : 0;
        bVal = b.lastItemAddedAt ? new Date(b.lastItemAddedAt).getTime() : 0;
        break;
      case 'itemCount':
        aVal = a.itemCount;
        bVal = b.itemCount;
        break;
      case 'sessionCount':
        aVal = a.sessionCount;
        bVal = b.sessionCount;
        break;
      default:
        aVal = 0;
        bVal = 0;
    }
    if (aVal! < bVal!) return sortDir === 'asc' ? -1 : 1;
    if (aVal! > bVal!) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Removed unused dateTimeFormatOptions

  // Calculate total items across all users
  const totalItems = users.reduce((sum, user) => sum + user.itemCount, 0);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-slate-500 text-sm">
              {users.length} total users
            </p>
            <p className="text-slate-500 text-sm">
              {totalItems} total items
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/notifications"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Notifications
          </a>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            title={`Sort ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading users...</div>
      ) : error ? (
        <div className="text-red-600 text-center py-8">{error}</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Last Added</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-700">Items</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-700">Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-700">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-700">
                          {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString() : 'Never'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-700">
                          {u.lastItemAddedAt ? new Date(u.lastItemAddedAt).toLocaleDateString() : 'No items'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                          {u.itemCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                          {u.sessionCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {sortedUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{u.email}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                      {u.itemCount}
                    </span>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 font-semibold text-xs">
                      {u.sessionCount}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-slate-500 text-xs font-medium">Last Login</div>
                    <div className="text-slate-700">
                      {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs font-medium">Last Added</div>
                    <div className="text-slate-700">
                      {u.lastItemAddedAt ? new Date(u.lastItemAddedAt).toLocaleDateString() : 'No items'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 