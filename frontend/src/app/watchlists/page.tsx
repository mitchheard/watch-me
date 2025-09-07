import WatchlistManager from '@/components/watchlist/WatchlistManager';

export default function WatchlistsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <a href="/" className="hover:text-gray-700">Home</a>
              <span>/</span>
              <span className="text-gray-900">Watchlists</span>
            </nav>
            <button
              onClick={() => {
                // This will be handled by the WatchlistManager component
                const event = new CustomEvent('openCreateModal');
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New List
            </button>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Organize your movies and TV shows into custom lists. Create personal lists or share them with friends and family.
          </p>
        </div>

        <WatchlistManager />
      </div>
    </div>
  );
}
