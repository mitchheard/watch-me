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

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  console.log('Current user:', user);

  useEffect(() => {
    if (!user || user.id !== ADMIN_USER_ID) return;
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setUsers(data);
        setLoading(false);
      })
      .catch(err => {
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
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (sortBy === 'createdAt' || sortBy === 'lastSignInAt') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

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
              className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col gap-3 transition-shadow hover:shadow-md"
            >
              <div className="font-semibold text-slate-800 text-lg truncate">{u.email}</div>
              <div className="text-xs text-slate-400 mt-1">
                Signup: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
              </div>
              <div className="text-xs text-slate-400 mt-1 mb-2">
                Last login: {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleString() : 'Never'}
              </div>
              <div className="flex flex-row justify-center gap-8 mt-3">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-500 mb-0.5">Watchlist Items</span>
                  <span className="text-2xl font-bold text-blue-600">{u.itemCount}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-500 mb-0.5">Sessions</span>
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