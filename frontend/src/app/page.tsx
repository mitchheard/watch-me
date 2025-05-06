'use client';

import { useState } from 'react';
import WatchlistForm from '@/components/watchlist/WatchlistForm';
import WatchlistItems from '@/components/watchlist/WatchlistItems';
import { WatchItem } from '@/types/watchlist';
import EditWatchItemModal from '@/components/watchlist/EditWatchItemModal';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingItem, setEditingItem] = useState<WatchItem | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white px-4 sm:px-8 py-10 flex flex-col items-center">
      <main className="w-full max-w-2xl space-y-10">
        <WatchlistForm onAddItem={() => setRefreshKey((k) => k + 1)} />
        <WatchlistItems
          key={refreshKey}
          onEditItem={(item) => setEditingItem(item)}
        />
      </main>

      {editingItem && (
        <EditWatchItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdate={() => {
            setRefreshKey((k) => k + 1);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
