'use client';

import { useState } from 'react';
import WatchlistPicker from '@/components/watchlist/WatchlistPicker';
import AddToMultipleListsModal from '@/components/watchlist/AddToMultipleListsModal';
import CreateWatchlistModal from '@/components/watchlist/CreateWatchlistModal';

export default function TestWatchlistsPage() {
  const [selectedWatchlistIds, setSelectedWatchlistIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const testItem = {
    tmdbId: 550,
    title: 'Fight Club',
    type: 'movie' as const,
    posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    releaseYear: 1999
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Test Watchlist Components
          </h1>
          <p className="text-gray-600">
            This page tests the new watchlist components in isolation.
          </p>
        </div>

        {/* Test WatchlistPicker */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">WatchlistPicker Component</h2>
          <WatchlistPicker
            selectedWatchlistIds={selectedWatchlistIds}
            onSelectionChange={setSelectedWatchlistIds}
            onCreateNew={() => setShowCreateModal(true)}
          />
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              Selected: {selectedWatchlistIds.length} watchlist(s)
            </p>
          </div>
        </div>

        {/* Test Add to Multiple Lists */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Add to Multiple Lists</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Test Add to Multiple Lists Modal
          </button>
        </div>

        {/* Test Create Watchlist */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Create Watchlist</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Test Create Watchlist Modal
          </button>
        </div>

        {/* Modals */}
        <AddToMultipleListsModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          item={testItem}
          onSuccess={() => console.log('Item added successfully!')}
        />

        <CreateWatchlistModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => console.log('Watchlist created successfully!')}
        />
      </div>
    </div>
  );
}
