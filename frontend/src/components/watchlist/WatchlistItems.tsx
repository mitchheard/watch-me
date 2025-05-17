'use client';

import { useEffect, useState } from 'react';
import { WatchItem } from '@/types/watchlist';
import EditWatchItemModal from './EditWatchItemModal';
import useWatchlistFilters from '@/hooks/useWatchlistFilters';
import { PencilSquareIcon, TrashIcon, FilmIcon, TvIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

type FilterType = 'all' | 'movie' | 'show';
type FilterStatus = 'all' | 'want-to-watch' | 'watching' | 'finished';

export default function WatchlistItems() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WatchItem | null>(null);
  const { type, status, updateFilters } = useWatchlistFilters();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
    const res = await fetch('/api/watchlist');
    const data = await res.json();
      
      if (!res.ok) {
        console.error('Failed to fetch items:', data.error);
        setItems([]);
        return;
      }
      
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
    setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/watchlist?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchItems();
    } else {
      console.error('Failed to delete item');
    }
  };

  if (!hasMounted) return <div className="text-slate-500 text-center py-10">Initializing...</div>;
  if (loading) return <div className="text-slate-500 text-center py-10">Loading your watchlist...</div>;

  const visibleItems = items
    .filter((item) => type === 'all' || item.type === type)
    .filter((item) => status === 'all' || item.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mt-8 w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center text-slate-800">Your Watchlist</h2>

      {/* Type Filters - Segmented Control Style */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center bg-slate-200 p-1 rounded-lg shadow-sm">
          {['all', 'movie', 'show'].map((t) => (
            <button
              key={t}
              onClick={() => updateFilters(t as FilterType, status)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-200 ${ 
                type === t
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'Shows'}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filters - Updated to Segmented Control Style */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex flex-wrap justify-center items-center bg-slate-200 p-1 rounded-lg shadow-sm gap-1">
          {['all', 'want-to-watch', 'watching', 'finished'].map((s) => (
            <button
              key={s}
              onClick={() => updateFilters(type, s as FilterStatus)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-200 ${ 
                status === s
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {s === 'all' ? 'All' : s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <motion.ul layout className="space-y-3">
        {visibleItems.map((item) => (
            <motion.li
            key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200/80 shadow-sm rounded-lg p-4 transition-shadow hover:shadow-md"
          >
              <div className="flex justify-between items-center gap-3">
                <div className="flex-grow min-w-0">
                  <h3 className="text-md font-semibold text-slate-800 truncate">
                  {item.title}
                </h3>
                  <div className="mt-1 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      {item.type === 'movie' ? 
                        <FilmIcon className="w-4 h-4 text-blue-500 flex-shrink-0" /> : 
                        <TvIcon className="w-4 h-4 text-blue-500 flex-shrink-0" /> 
                      }
                      <p className="text-sm text-slate-500">
                        {item.type.replace(/\b\w/g, l => l.toUpperCase())}
                  {item.type === 'show' && item.currentSeason && (
                          <span className="text-slate-400">
                            {` — S${item.currentSeason}`}
                      {item.totalSeasons ? ` of ${item.totalSeasons}` : ''}
                    </span>
                  )}
                </p>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full 
                          ${item.status === 'want-to-watch' ? 'bg-blue-100 text-blue-700' :
                            item.status === 'watching' ? 'bg-yellow-100 text-yellow-700' :
                            item.status === 'finished' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-700' 
                          }`}
                      >
                        {item.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Added: {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setSelectedItem(item)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-100"
                    aria-label="Edit item"
                >
                    <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                      if (confirm(`Delete "${item.title}"? This action cannot be undone.`)) {
                      handleDelete(item.id);
                    }
                  }}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-100"
                    aria-label="Delete item"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            </motion.li>
        ))}
        </motion.ul>
      ) : (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-20 h-20 mx-auto text-slate-300 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <p className="text-slate-600 font-semibold text-lg mb-1">
            Your Watchlist is Empty
          </p>
          <p className="text-sm text-slate-400">
            Add some movies or shows to get started!
          </p>
        </div>
      )}

      {selectedItem && (
        <EditWatchItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={() => {
            fetchItems();
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}
