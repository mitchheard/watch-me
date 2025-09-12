'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface WatchlistBreadcrumbProps {
  watchlistId: string;
  initialName?: string | null;
}

export default function WatchlistBreadcrumb({ watchlistId, initialName = null }: WatchlistBreadcrumbProps) {
  const [watchlistName, setWatchlistName] = useState<string | null>(initialName);
  const [loading, setLoading] = useState(!initialName); // Only loading if no initial name provided

  useEffect(() => {
    // If we already have a name from props, don't fetch
    if (initialName) {
      setLoading(false);
      return;
    }

    const fetchWatchlistName = async () => {
      try {
        const response = await fetch(`/api/watchlists/${watchlistId}`);
        if (response.ok) {
          const watchlist = await response.json();
          setWatchlistName(watchlist.name);
        } else {
          setWatchlistName('Error loading name');
        }
      } catch (error) {
        console.error('Failed to fetch watchlist name:', error);
        setWatchlistName('Error loading name');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlistName();
  }, [watchlistId, initialName]);

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500">
      <Link href="/watchlists" className="hover:text-gray-700">
        Watchlists
      </Link>
      <span>/</span>
      <span className="text-gray-900">
        {loading ? 'Loading...' : watchlistName || 'Watchlist'}
      </span>
    </nav>
  );
}
