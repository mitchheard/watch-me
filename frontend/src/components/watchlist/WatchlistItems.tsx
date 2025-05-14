'use client';

import { useEffect, useState } from 'react';
import { WatchItem } from '@/types/watchlist';
import EditWatchItemModal from './EditWatchItemModal';
import useWatchlistFilters from '@/hooks/useWatchlistFilters';

type FilterType = 'all' | 'movie' | 'show';
type FilterStatus = 'all' | 'want-to-watch' | 'watching' | 'finished';

export default function WatchlistItems() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WatchItem | null>(null);
  const { type, status, updateFilters } = useWatchlistFilters();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
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

  if (!hasMounted) return null;
  if (loading) return <p className="text-slate-500 text-center py-10">Loading your watchlist...</p>;

  const visibleItems = items
    .filter((item) => type === 'all' || item.type === type)
    .filter((item) => status === 'all' || item.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mt-8 w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center text-slate-800">Your Watchlist</h2>

      {/* Filter by Type */}
      <div className="mb-6 w-full flex justify-center gap-2 sm:gap-3 bg-slate-200 p-1 rounded-lg">
        {['all', 'movie', 'show'].map((t) => (
          <button
            key={t}
            onClick={() => updateFilters(t as FilterType, status)}
            className={`flex-grow px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 ${
              type === t
                ? 'bg-white text-blue-600 shadow-sm' // Active state
                : 'bg-transparent text-slate-600 hover:bg-slate-300/70' // Inactive state
            }`}
          >
            {t === 'all' ? 'All Types' : t === 'movie' ? 'Movies' : 'Shows'}
          </button>
        ))}
      </div>

      {/* Filter by Status */}
      <div className="flex justify-center flex-wrap gap-2 mb-8">
        {['all', 'want-to-watch', 'watching', 'finished'].map((s) => (
          <button
            key={s}
            onClick={() => updateFilters(type, s as FilterStatus)}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition-colors duration-150 ease-in-out border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-100 ${
              status === s
                ? 'bg-blue-600 text-white border-blue-600' // Active state
                : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50 hover:border-slate-400' // Inactive state
            }`}
          >
            {s === 'all' ? 'All Statuses' : s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Watchlist Items */}
      {visibleItems.length > 0 ? (
        <ul className="space-y-4">
          {visibleItems.map((item) => (
            <li
              key={item.id}
              // Updated styles for list items: bg-white, consistent border and shadow
              className="bg-white border border-slate-200 shadow-sm rounded-lg p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                  <h3 className="text-md font-semibold text-slate-800">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {item.type.replace(/\b\w/g, l => l.toUpperCase())} — {item.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {item.type === 'show' && item.currentSeason && (
                      <span className="text-slate-400">
                        {/* Slightly different styling for season info */}
                        {` — S${item.currentSeason}`}
                        {item.totalSeasons ? ` of ${item.totalSeasons}` : ''}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Added: {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center flex-shrink-0">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this item?')) {
                        handleDelete(item.id);
                      }
                    }}
                    className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-slate-400 mb-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <p className="text-slate-500 font-medium">
            Your watchlist is empty or no items match your filters.
          </p>
          <p className="text-sm text-slate-400 mt-1">Add some movies or shows to get started!</p>
        </div>
      )}

      {/* Edit Modal */}
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
