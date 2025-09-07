'use client';

import WatchlistManager from '@/components/watchlist/WatchlistManager';

export default function WatchlistsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <a href="/" className="hover:text-gray-700">Home</a>
            <span>/</span>
            <span className="text-gray-900">Watchlists</span>
          </nav>
          <p className="text-sm sm:text-base text-gray-600">
            Organize your movies and TV shows into custom lists. Create personal lists or share them with friends and family.
          </p>
        </div>

        <WatchlistManager />
      </div>
    </div>
  );
}
