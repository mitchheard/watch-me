'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WatchlistItems from '@/components/watchlist/WatchlistItems';
import WatchlistBreadcrumb from '@/components/watchlist/WatchlistBreadcrumb';

interface WatchlistPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function WatchlistPage({ params }: WatchlistPageProps) {
  const [id, setId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);
  
  console.log('WatchlistPage - ID:', id);

  // Get the watchlist name from URL parameters (passed from previous screen)
  const watchlistName = searchParams.get('name');
  const isInvited = searchParams.get('invited') === 'true';

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

        {/* Show welcome message for invited users */}
        {isInvited && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">🎉</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Welcome to the watchlist!
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  You've been invited to collaborate on this shared watchlist. You can now add movies and TV shows, track your progress, and collaborate with others.
                </p>
              </div>
            </div>
          </div>
        )}

        {id ? (
          <Suspense fallback={<div className="text-center py-10">Loading watchlist...</div>}>
            <WatchlistItems 
              watchlistId={id}
            />
          </Suspense>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-600">Invalid watchlist ID</p>
            <Link href="/watchlists" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
              ← Back to Watchlists
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
