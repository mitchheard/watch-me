'use client';

import { useEffect, useState } from 'react';
import { WatchItem } from '@/types/watchlist';

export default function WatchlistItems({
  onEditItem,
}: {
  onEditItem: (item: WatchItem) => void;
}) {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) return <p className="text-gray-500 text-center">Loading your watchlist...</p>;

  return (
    <div className="mt-12 w-full">
      <h2 className="text-2xl font-semibold mb-6 text-center">📺 Your Watchlist</h2>
      <ul className="space-y-4">
        {items
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((item) => (
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
                    Added: {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => onEditItem(item)}
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
    </div>
  );
}
