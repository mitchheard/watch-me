"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// TODO: Move this to env or a Profile table
const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Signup Date' },
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
  const [sortBy, setSortBy] = useState('createdAt');
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

  const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-2">Admin: User Overview</h1>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-slate-500 text-sm font-medium">
          Total users: <span className="font-bold text-blue-600">{users.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sortBy" className="text-xs text-slate-500 font-medium">Sort by:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="ml-1 px-2 py-1 rounded border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={`Sort ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
      {loading ? (
        <div>Loading users...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedUsers.map((u) => (
            <div
              key={u.id}
              className="group rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-start gap-4 sm:gap-6 transition-all duration-200 ease-in-out hover:shadow-md hover:border-slate-300"
            >
              <div className="flex flex-col w-full sm:flex-grow">
                <div className="font-semibold text-slate-800 text-lg truncate mb-1 text-left">{u.email}</div>
                <div className="text-xs text-slate-400 text-left">
                  Signup: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
                <div className="text-xs text-slate-400 text-left">
                  Last login: {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleString(undefined, dateTimeFormatOptions) : 'Never'}
                </div>
                <div className="text-xs text-slate-400 text-left">
                  Last item added: {u.lastItemAddedAt ? new Date(u.lastItemAddedAt).toLocaleString(undefined, dateTimeFormatOptions) : 'No items added'}
                </div>
              </div>
              <div className="flex flex-row sm:flex-col justify-around sm:items-end gap-4 sm:gap-3 w-full sm:w-auto mt-3 sm:mt-0 sm:flex-shrink-0 sm:pt-1">
                <div className="flex flex-col items-center sm:items-end">
                  <span className="text-xs text-slate-500">Watchlist Items</span>
                  <span className="text-2xl font-bold text-blue-600">{u.itemCount}</span>
                </div>
                <div className="flex flex-col items-center sm:items-end">
                  <span className="text-xs text-slate-500">Sessions</span>
                  <span className="text-2xl font-bold text-green-600">{u.sessionCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 