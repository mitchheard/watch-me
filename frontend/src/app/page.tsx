'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../contexts/AuthContext';
import WatchlistForm from '@/components/watchlist/WatchlistForm';
// import WatchlistItems from '@/components/watchlist/WatchlistItems';
import Modal from '@/components/Modal';
import { FilmIcon, TvIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { WatchlistFormData } from '@/types/watchlist';
import Image from 'next/image';

const WatchlistItems = dynamic(() => import('@/components/watchlist/WatchlistItems'), {
  ssr: false,
});

function DemoWatchlist() {
  type DemoStatus = 'want-to-watch' | 'watching' | 'finished';
  const demoItems: { title: string; type: 'movie' | 'show'; status: DemoStatus; poster: string; year: string | number }[] = [
    {
      title: 'Moana 2',
      type: 'movie',
      status: 'want-to-watch',
      poster: '/demo/moana2.jpg',
      year: 2024,
    },
    {
      title: 'The Last of Us',
      type: 'show',
      status: 'watching',
      poster: '/demo/thelastofus.jpg',
      year: '2023-',
    },
    {
      title: 'The Sandlot',
      type: 'movie',
      status: 'finished',
      poster: '/demo/sandlot.jpg',
      year: 1993,
    },
  ];
  const statusMap: Record<DemoStatus, { label: string; color: string }> = {
    'want-to-watch': { label: 'Want to Watch', color: 'bg-blue-100 text-blue-700' },
    'watching': { label: 'Watching', color: 'bg-yellow-100 text-yellow-700' },
    'finished': { label: 'Finished', color: 'bg-green-100 text-green-700' },
  };
  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">See what you can track:</h3>
      <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
        {demoItems.map((item) => (
          <div key={item.title} className="bg-white rounded-lg shadow-md border border-slate-100 p-4 w-64 flex flex-col items-center hover:shadow-lg transition-shadow">
            <div className="mb-3 w-[60px] h-[90px] flex items-center justify-center">
              <Image 
                src={item.poster}
                alt={item.title}
                width={60}
                height={90}
                className="rounded shadow object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/no-image.svg'; // Use a local fallback image or a placeholder
                }}
              />
            </div>
            <div className="text-md font-bold text-slate-800 mb-1 text-center">{item.title}</div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                {item.type === 'movie' ? <span>🎬</span> : <span>📺</span>}
                {item.type === 'movie' ? 'Movie' : 'TV Show'}
              </span>
              <span className="text-xs text-slate-400">{item.year}</span>
            </div>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusMap[item.status].color}`}>{statusMap[item.status].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingPage() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 bg-gradient-to-br from-blue-50 to-white min-h-screen flex flex-col justify-center">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Movies &amp; TV Shows</h1>
        <p className="text-xl text-gray-600">Keep track of what you&apos;re watching and what you want to watch next.<br />Add rich metadata, posters, and more!</p>
      </div>
      <DemoWatchlist />
      <div className="grid md:grid-cols-3 gap-8 mb-12 mt-12">
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
          <p className="text-gray-600">Mark what you&apos;ve watched and what&apos;s next.</p>
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-600 mb-4">Ready to start tracking your watchlist?</p>
        <button
          onClick={loginWithGoogle}
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-lg text-lg"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const { user, isLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  const handleAddItem = async (item: WatchlistFormData) => {
    await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    setRefreshKey(prevKey => prevKey + 1);
    setIsAddItemModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Authenticating...</p>
        {/* You could add a spinner here */}
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <>
      <Suspense fallback={<div className="text-center py-10">Loading watchlist...</div>}>
        <WatchlistItems key={refreshKey} />
      </Suspense>

      <main className="flex-1">
        {isAddItemModalOpen && (
          <Modal onClose={() => setIsAddItemModalOpen(false)} title="Add Movie or TV Show">
            <WatchlistForm onAddItem={handleAddItem} />
          </Modal>
        )}
      </main>
    </>
  );
}