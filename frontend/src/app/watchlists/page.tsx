import WatchlistManager from '@/components/watchlist/WatchlistManager';

export default function WatchlistsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            My Watchlists
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Organize your movies and TV shows into custom lists. Create personal lists or share them with friends and family.
          </p>
        </div>

        <WatchlistManager />
      </div>
    </div>
  );
}
