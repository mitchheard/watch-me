import { notFound } from 'next/navigation';
import WatchlistItems from '@/components/watchlist/WatchlistItems';

interface WatchlistPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WatchlistPage({ params }: WatchlistPageProps) {
  const { id } = await params;
  
  console.log('WatchlistPage - ID:', id);

  // For now, we'll use a placeholder name
  // In a real implementation, you'd fetch the watchlist data here
  const watchlistName = 'My Watchlist';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <a href="/watchlists" className="hover:text-gray-700">
              Watchlists
            </a>
            <span>/</span>
            <span className="text-gray-900">{watchlistName}</span>
          </nav>
          
          <h1 className="text-2xl font-bold text-gray-900">
            {watchlistName}
          </h1>
        </div>

        {id ? (
          <WatchlistItems 
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
