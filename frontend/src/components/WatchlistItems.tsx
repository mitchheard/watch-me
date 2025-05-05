'use client';

import { useEffect, useState } from 'react';

interface WatchItem {
  id: number;
  title: string;
  type: string;
  status: string;
  currentSeason?: number | null;
  totalSeasons?: number | null;
  createdAt: string;
}

export default function WatchlistItems() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const res = await fetch('/api/watchlist');
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) return <p className="text-gray-500">Loading watchlist...</p>;

  return (
    <div className="mt-10 w-full max-w-lg">
      <h2 className="text-lg font-semibold mb-4">Your Watchlist</h2>
      <ul className="space-y-4">
        {items.map((item) => {
          const createdDate = new Date(item.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          return (
            <li key={item.id} className="border p-4 rounded shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-gray-400">{createdDate}</span>
              </div>
              <div className="text-sm text-gray-600">
                {item.type} — {item.status}
                {item.type === 'show' && item.currentSeason && (
                  <span>
                    {' '}
                    — Season {item.currentSeason}
                    {item.totalSeasons ? ` of ${item.totalSeasons}` : ''}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
