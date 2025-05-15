'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WatchlistForm from '@/components/watchlist/WatchlistForm';
import WatchlistItems from '@/components/watchlist/WatchlistItems';
import Modal from '@/components/Modal';
import { PlusIcon, FilmIcon, TvIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

function LandingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Movies & TV Shows</h1>
        <p className="text-xl text-gray-600">Keep track of what you're watching and what you want to watch next.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <FilmIcon className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Movies</h3>
          <p className="text-gray-600">Track your movie watchlist and progress.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <TvIcon className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">TV Shows</h3>
          <p className="text-gray-600">Keep track of your favorite TV series and episodes.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <CheckCircleIcon className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Progress</h3>
          <p className="text-gray-600">Mark what you've watched and what's next.</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-600 mb-4">Ready to start tracking your watchlist?</p>
        <button
          onClick={() => {
            const signInButton = document.querySelector('[aria-label="Sign In"]') as HTMLButtonElement;
            signInButton?.click();
          }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  const handleAddItemSuccess = () => {
    setRefreshKey(prevKey => prevKey + 1);
    setIsAddItemModalOpen(false);
  };

  if (!user) {
    return <LandingPage />;
  }

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

      <Suspense fallback={<div className="text-center py-10">Loading watchlist...</div>}>
        <WatchlistItems key={refreshKey} />
      </Suspense>

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