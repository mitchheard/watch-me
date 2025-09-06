'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import WatchlistItems from './WatchlistItems';

interface Watchlist {
  id: string;
  name: string;
  description?: string;
  isShared: boolean;
  isDefault: boolean;
  owner: {
    id: string;
    email: string;
  };
  members: Array<{
    user: {
      id: string;
      email: string;
    };
  }>;
  _count: {
    items: number;
  };
}

export default function DefaultWatchlistView() {
  const { user } = useAuth();
  const [defaultWatchlist, setDefaultWatchlist] = useState<Watchlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDefaultWatchlist();
    }
  }, [user]);

  const fetchDefaultWatchlist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/watchlists');
      if (!response.ok) {
        throw new Error('Failed to fetch watchlists');
      }
      const data = await response.json();
      
      // Find the user's default personal list
      const defaultList = data.watchlists.find((list: Watchlist) => 
        list.isDefault && list.owner.id === user?.id
      );
      
      setDefaultWatchlist(defaultList || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch default watchlist');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your watchlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchDefaultWatchlist}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!defaultWatchlist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No default watchlist found</p>
          <a
            href="/watchlists"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Watchlists
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {defaultWatchlist.name}
          </h1>
          {defaultWatchlist.description && (
            <p className="text-gray-600 mt-2">{defaultWatchlist.description}</p>
          )}
        </div>

        <WatchlistItems 
          watchlistId={defaultWatchlist.id}
          watchlistName={defaultWatchlist.name}
        />
      </div>
    </div>
  );
}
