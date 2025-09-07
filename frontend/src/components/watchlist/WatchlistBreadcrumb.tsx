'use client';

import { useEffect, useState } from 'react';

interface WatchlistBreadcrumbProps {
  watchlistId: string;
  initialName?: string;
}

export default function WatchlistBreadcrumb({ watchlistId, initialName = 'My Watchlist' }: WatchlistBreadcrumbProps) {
  const [watchlistName, setWatchlistName] = useState(initialName);

  useEffect(() => {
    const fetchWatchlistName = async () => {
      try {
        const response = await fetch(`/api/watchlists/${watchlistId}`);
        if (response.ok) {
          const watchlist = await response.json();
          setWatchlistName(watchlist.name || 'My Watchlist');
        }
      } catch (error) {
        console.error('Failed to fetch watchlist name:', error);
      }
    };

    fetchWatchlistName();
  }, [watchlistId]);

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500">
      <a href="/watchlists" className="hover:text-gray-700">
        Watchlists
      </a>
      <span>/</span>
      <span className="text-gray-900">{watchlistName}</span>
    </nav>
  );
}
