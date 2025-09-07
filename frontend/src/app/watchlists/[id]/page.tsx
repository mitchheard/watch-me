import { notFound } from 'next/navigation';
import IndividualWatchlistItems from '@/components/watchlist/IndividualWatchlistItems';

interface WatchlistPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WatchlistPage({ params }: WatchlistPageProps) {
  const { id } = await params;
  
  console.log('WatchlistPage - ID:', id);

  // Fetch the actual watchlist data
  let watchlistName = 'My Watchlist';
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/watchlists/${id}`, {
      cache: 'no-store'
    });
    if (response.ok) {
      const watchlist = await response.json();
      watchlistName = watchlist.name || 'My Watchlist';
    }
  } catch (error) {
    console.error('Failed to fetch watchlist:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="mb-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <a href="/watchlists" className="hover:text-gray-700">
              Watchlists
            </a>
            <span>/</span>
            <span className="text-gray-900">{watchlistName}</span>
          </nav>
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
