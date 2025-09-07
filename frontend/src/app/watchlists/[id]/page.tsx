import { notFound } from 'next/navigation';
import IndividualWatchlistItems from '@/components/watchlist/IndividualWatchlistItems';
import WatchlistBreadcrumb from '@/components/watchlist/WatchlistBreadcrumb';

interface WatchlistPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WatchlistPage({ params }: WatchlistPageProps) {
  const { id } = await params;
  
  console.log('WatchlistPage - ID:', id);

  // Use a default name - the actual name will be fetched client-side
  const watchlistName = 'My Watchlist';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <WatchlistBreadcrumb watchlistId={id} initialName={watchlistName} />
        </div>

        {id ? (
          <IndividualWatchlistItems 
            watchlistId={id}
            watchlistName={watchlistName}
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
