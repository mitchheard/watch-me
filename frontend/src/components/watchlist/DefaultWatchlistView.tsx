'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { ShareIcon } from '@heroicons/react/24/outline';

// Import the original WatchlistItems component dynamically to match the original structure
const WatchlistItems = dynamic(() => import('./WatchlistItems'), {
  ssr: false,
  loading: () => <div className="text-center py-10">Loading watchlist...</div>
});

interface DefaultWatchlistViewProps {
  isShared?: boolean;
  watchlistName?: string;
}

export default function DefaultWatchlistView({ 
  isShared = false, 
  watchlistName = "My Watchlist" 
}: DefaultWatchlistViewProps) {
  const { user, isLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Please log in to view your watchlist</p>
      </div>
    );
  }

  return (
    <>
      {/* Header with optional shared indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{watchlistName}</h1>
          {isShared && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <ShareIcon className="h-3 w-3" />
              Shared
            </div>
          )}
        </div>
        <p className="text-gray-600 mt-1">
          {isShared ? 'A shared watchlist with friends and family' : 'Your personal collection of movies and TV shows'}
        </p>
      </div>

      {/* Use the exact same structure as the original main page */}
      <Suspense fallback={<div className="text-center py-10">Loading watchlist...</div>}>
        <WatchlistItems key={refreshKey} />
      </Suspense>
    </>
  );
}
