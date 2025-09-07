'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import WatchlistItems from '@/components/watchlist/WatchlistItems';
import WatchlistBreadcrumb from '@/components/watchlist/WatchlistBreadcrumb';

interface WatchlistPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function WatchlistPage({ params }: WatchlistPageProps) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);
  
  console.log('WatchlistPage - ID:', id);

  // Use a default name - the actual name will be fetched client-side
  const watchlistName = 'My Watchlist';

  // Show loading state while params are being resolved
  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
          <div className="text-center py-10">
            <p className="text-slate-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <WatchlistBreadcrumb watchlistId={id} initialName={watchlistName} />
        </div>

        {id ? (
          <WatchlistItems 
            watchlistId={id}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-red-600">Invalid watchlist ID</p>
            <a href="/watchlists" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
              ← Back to Watchlists
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
