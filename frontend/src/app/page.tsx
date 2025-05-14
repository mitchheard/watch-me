'use client';

import { useState } from 'react';
import WatchlistForm from '@/components/watchlist/WatchlistForm';
import WatchlistItems from '@/components/watchlist/WatchlistItems';
import Modal from '@/components/Modal';
import { PlusIcon } from '@heroicons/react/24/solid';

export default function Page() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  const handleAddItemSuccess = () => {
    setRefreshKey(prevKey => prevKey + 1);
    setIsAddItemModalOpen(false);
  };

  return (
    <>
      <div className="mb-6 text-center sm:text-right">
        <button
          onClick={() => setIsAddItemModalOpen(true)}
          className="hidden sm:inline-flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add New Item
        </button>
      </div>

      <WatchlistItems key={refreshKey} />

      <button
        onClick={() => setIsAddItemModalOpen(true)}
        className="sm:hidden fixed bottom-20 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 z-20"
        aria-label="Add new item"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      <main className="flex-1">
        {isAddItemModalOpen && (
          <Modal onClose={() => setIsAddItemModalOpen(false)} title="Add New Item">
            <WatchlistForm onAddItem={handleAddItemSuccess} />
          </Modal>
        )}
      </main>
    </>
  );
}