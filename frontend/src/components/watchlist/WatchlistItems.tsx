'use client';

import { useEffect, useState } from 'react';
import { WatchItem } from '@/types/watchlist';
import EditWatchItemModal from './EditWatchItemModal';
import { useSearchParams, useRouter } from 'next/navigation';

const FILTER_KEY = 'watchlist-type-filter';
const FILTER_STATUS_KEY = 'watchlist-status-filter';

type Filter = 'all' | 'movie' | 'show';
type Status = 'all' | 'want-to-watch' | 'watching' | 'finished';

export default function WatchlistItems() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WatchItem | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [statusFilter, setStatusFilter] = useState<Status>('all');
  const [hasMounted, setHasMounted] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');

    if (typeParam === 'movie' || typeParam === 'show') {
      setFilter(typeParam);
    }

    if (
      statusParam === 'want-to-watch' ||
      statusParam === 'watching' ||
      statusParam === 'finished'
    ) {
      setStatusFilter(statusParam);
    }

    const savedType = localStorage.getItem(FILTER_KEY);
    if (savedType === 'movie' || savedType === 'show') {
      setFilter(savedType);
    }

    const savedStatus = localStorage.getItem(FILTER_STATUS_KEY);
    if (
      savedStatus === 'want-to-watch' ||
      savedStatus === 'watching' ||
      savedStatus === 'finished'
    ) {
      setStatusFilter(savedStatus);
    }

    setHasMounted(true);
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await fetch('/api/watchlist');
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/watchlist?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchItems();
    } else {
      console.error('Failed to delete item');
    }
  };

  const updateQueryParams = (type: Filter, status: Status) => {
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (status !== 'all') params.set('status', status);
    router.push(`?${params.toString()}`);
    setFilter(type);
    setStatusFilter(status);
    localStorage.setItem(FILTER_KEY, type);
    localStorage.setItem(FILTER_STATUS_KEY, status);
  };

  if (!hasMounted) return null;
  if (loading) return <p className="text-gray-500 text-center">Loading your watchlist...</p>;

  const visibleItems = items
    .filter((item) => filter === 'all' || item.type === filter)
    .filter((item) => statusFilter === 'all' || item.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mt-12 w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center">📺 Your Watchlist</h2>

      <div className="mb-6 w-full max-w-xl mx-auto flex justify-center gap-2 sm:gap-4">
        {['all', 'movie', 'show'].map((t) => (
          <button
            key={t}
            onClick={() => updateQueryParams(t as Filter, statusFilter)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === t
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border-transparent'
            }`}
          >
            {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'Shows'}
          </button>
        ))}
      </div>

      <div className="flex justify-center flex-wrap gap-2 mt-4">
        {['all', 'want-to-watch', 'watching', 'finished'].map((status) => (
          <button
            key={status}
            onClick={() => updateQueryParams(filter, status as Status)}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-white'
            }`}
          >
            {status.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      <ul className="space-y-4 mt-6">
        {visibleItems.map((item) => (
          <li
            key={item.id}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm rounded-xl p-5 transition hover:shadow-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {item.type} — {item.status}
                  {item.type === 'show' && item.currentSeason && (
                    <span>
                      {' '}
                      — Season {item.currentSeason}
                      {item.totalSeasons ? ` of ${item.totalSeasons}` : ''}
                    </span>
                  )}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Added: {new Date(item.createdAt).toISOString().split('T')[0]}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this item?')) {
                      handleDelete(item.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {visibleItems.length === 0 && (
        <p className="text-center text-sm text-neutral-500 mt-8">
          No items match the selected filters.
        </p>
      )}

      {selectedItem && (
        <EditWatchItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={fetchItems}
        />
      )}
    </div>
  );
}