'use client';

import { useEffect, useState } from 'react';
import { WatchItem, WatchlistFormData } from '@/types/watchlist';
import WatchlistForm from './WatchlistForm';
import Modal from '@/components/Modal';
import useWatchlistFilters from '@/hooks/useWatchlistFilters';
import { FilmIcon, TvIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Dialog } from '@headlessui/react';

type FilterStatus = 'all' | 'want-to-watch' | 'watching' | 'finished';

// Define poster sizes for card and modal (2:3 aspect ratio)
const CARD_POSTER_WIDTH = 56;
const CARD_POSTER_HEIGHT = 84;
const MODAL_POSTER_WIDTH = 80;
const MODAL_POSTER_HEIGHT = 120;

export default function OriginalWatchlistItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WatchItem | null>(null);
  const { type, status, updateFilters } = useWatchlistFilters();
  const [hasMounted, setHasMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rateItem, setRateItem] = useState<WatchItem | null>(null);
  const [rateValue, setRateValue] = useState<string | null>(null);
  const [isRateSubmitting, setIsRateSubmitting] = useState(false);
  const [modalStep, setModalStep] = useState<'edit' | 'rate'>('edit');
  const [modalItem, setModalItem] = useState<WatchItem | null>(null);

  useEffect(() => {
    setHasMounted(true);
    fetchItems();
  }, []);

  if (!user) return null;

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/watchlist');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch watchlist items:', error);
      toast.error('Failed to load watchlist items');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/watchlist?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete item');

      setItems(items.filter(item => item.id !== id));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleUpdateItem = async (id: number, updatedItem: WatchlistFormData) => {
    try {
      const res = await fetch(`/api/watchlist?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });

      if (!res.ok) throw new Error('Failed to update item');

      const updatedData = await res.json();
      setItems(items.map(item => item.id === id ? updatedData : item));
      setSelectedItem(null);
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Failed to update item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleRateItem = async (item: WatchItem, rating: string) => {
    setIsRateSubmitting(true);
    try {
      const res = await fetch(`/api/watchlist?id=${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, rating }),
      });

      if (!res.ok) throw new Error('Failed to rate item');

      const updatedData = await res.json();
      setItems(items.map(i => i.id === item.id ? updatedData : i));
      setRateItem(null);
      setRateValue(null);
      toast.success('Rating saved successfully');
    } catch (error) {
      console.error('Failed to rate item:', error);
      toast.error('Failed to save rating');
    } finally {
      setIsRateSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'want to watch':
        return 'bg-blue-100 text-blue-700';
      case 'watching':
        return 'bg-yellow-100 text-yellow-700';
      case 'finished':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'loved':
        return 'text-red-600';
      case 'liked':
        return 'text-green-600';
      case 'not for me':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  // Filter items based on current filters
  const filteredItems = items.filter(item => {
    const typeMatch = type === 'all' || item.type === type;
    const statusMatch = status === 'all' || item.status === status;
    return typeMatch && statusMatch;
  });

  // Get counts for each filter
  const movieCount = items.filter(item => item.type === 'movie').length;
  const tvCount = items.filter(item => item.type === 'tv').length;
  const wantToWatchCount = items.filter(item => item.status === 'want-to-watch').length;

  if (!hasMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading watchlist...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading watchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateFilters('all', status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  type === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All {items.length}
              </button>
              <button
                onClick={() => updateFilters('movie', status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  type === 'movie' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FilmIcon className="h-4 w-4 inline mr-1" />
                Movies {movieCount}
              </button>
              <button
                onClick={() => updateFilters('show', status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  type === 'show' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TvIcon className="h-4 w-4 inline mr-1" />
                TV Shows {tvCount}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(e) => updateFilters(type, e.target.value as FilterStatus)}
                className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border-0 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="want-to-watch">Want to Watch ({wantToWatchCount})</option>
                <option value="watching">Watching</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items List */}
        {filteredItems.length > 0 ? (
          <motion.ul layout className="space-y-2">
            {filteredItems.map((item) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg p-3 transition-all hover:shadow-md relative border border-slate-200 bg-white hover:border-slate-300"
                onClick={() => setModalItem(item)}
              >
                <div className="flex items-end gap-3">
                  {/* Poster */}
                  <div className="flex-shrink-0">
                    {item.tmdbPosterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${item.tmdbPosterPath}`}
                        alt={`${item.title} poster`}
                        width={CARD_POSTER_WIDTH}
                        height={CARD_POSTER_HEIGHT}
                        className="rounded-lg shadow-sm object-cover border border-slate-200"
                        style={{ aspectRatio: '2/3', width: CARD_POSTER_WIDTH, height: CARD_POSTER_HEIGHT }}
                        unoptimized
                      />
                    ) : (
                      <Image
                        src="/no-image.svg"
                        alt="No poster available"
                        width={CARD_POSTER_WIDTH}
                        height={CARD_POSTER_HEIGHT}
                        className="rounded-lg shadow-sm bg-slate-200 object-cover border border-slate-200"
                        style={{ aspectRatio: '2/3', width: CARD_POSTER_WIDTH, height: CARD_POSTER_HEIGHT }}
                        unoptimized
                      />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title and Type Badge */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-base text-slate-900 truncate">{item.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 inline-flex items-center
                          ${item.type === 'movie' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                          }`}
                      >
                        {item.type === 'movie' ? 'Movie' : 'TV Show'}
                      </span>
                    </div>

                    {/* Year */}
                    {(item.tmdbMovieReleaseYear || item.tmdbTvFirstAirYear) && (
                      <p className="text-sm text-slate-500 mb-2">
                        {item.tmdbMovieReleaseYear || item.tmdbTvFirstAirYear}
                      </p>
                    )}

                    {/* Status and Rating */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      {item.rating && (
                        <span className={`text-sm font-medium ${getRatingColor(item.rating)}`}>
                          {item.rating}
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No items found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first item
            </button>
          </div>
        )}

        {/* Add Item Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-6 w-6" />
        </button>

        {/* Add Item Modal */}
        {showAddModal && (
          <Modal onClose={() => setShowAddModal(false)} title="Add Movie or TV Show">
            <WatchlistForm 
              _onAddItem={async (item) => {
                try {
                  const res = await fetch('/api/watchlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item),
                  });
                  
                  if (!res.ok) throw new Error('Failed to add item');
                  
                  const newItem = await res.json();
                  setItems([newItem, ...items]);
                  setShowAddModal(false);
                  toast.success('Item added successfully');
                } catch (error) {
                  console.error('Failed to add item:', error);
                  toast.error('Failed to add item');
                }
              }}
            />
          </Modal>
        )}

        {/* Detailed Item Modal */}
        {modalItem && (
          <Dialog open={!!modalItem} onClose={() => setModalItem(null)} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
            <div className="flex items-end sm:items-center justify-center min-h-screen px-2 sm:px-4">
              <Dialog.Panel className="fixed bottom-0 left-0 right-0 w-full rounded-t-2xl sm:rounded-2xl bg-white shadow-xl transform transition-all sm:max-w-2xl sm:mx-auto max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{modalItem.title}</h3>
                    <button
                      onClick={() => setModalItem(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex gap-4 mb-4">
                    {/* Poster */}
                    <div className="flex-shrink-0">
                      {modalItem.tmdbPosterPath ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${modalItem.tmdbPosterPath}`}
                          alt={`${modalItem.title} poster`}
                          width={120}
                          height={180}
                          className="rounded-lg shadow-sm object-cover border border-slate-200"
                          style={{ aspectRatio: '2/3' }}
                          unoptimized
                        />
                      ) : (
                        <Image
                          src="/no-image.svg"
                          alt="No poster available"
                          width={120}
                          height={180}
                          className="rounded-lg shadow-sm bg-slate-200 object-cover border border-slate-200"
                          style={{ aspectRatio: '2/3' }}
                          unoptimized
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            modalItem.type === 'movie' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {modalItem.type === 'movie' ? 'Movie' : 'TV Show'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(modalItem.status)}`}>
                          {modalItem.status}
                        </span>
                      </div>

                      {(modalItem.tmdbMovieReleaseYear || modalItem.tmdbTvFirstAirYear) && (
                        <p className="text-sm text-gray-600 mb-2">
                          {modalItem.tmdbMovieReleaseYear || modalItem.tmdbTvFirstAirYear}
                        </p>
                      )}

                      {modalItem.rating && (
                        <p className="text-sm text-gray-600 mb-2">
                          Rating: <span className={`font-medium ${getRatingColor(modalItem.rating)}`}>{modalItem.rating}</span>
                        </p>
                      )}

                      <p className="text-sm text-gray-600 mb-4">
                        Added: {new Date(modalItem.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>

                      {modalItem.tmdbOverview && (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {modalItem.tmdbOverview}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      className="flex-1 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      onClick={() => {
                        setSelectedItem(modalItem);
                        setModalItem(null);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="flex-1 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      onClick={() => {
                        setRateItem(modalItem);
                        setModalItem(null);
                      }}
                    >
                      Rate
                    </button>
                    <button
                      className="flex-1 px-4 py-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                      onClick={() => {
                        handleDeleteItem(modalItem.id);
                        setModalItem(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}

        {/* Edit Item Modal */}
        {selectedItem && (
          <Modal onClose={() => setSelectedItem(null)} title="Edit Item">
            <WatchlistForm 
              itemToEdit={selectedItem}
              _onAddItem={async () => {}} // Not used in edit mode
              onUpdateItem={handleUpdateItem}
              onCancelEdit={() => setSelectedItem(null)}
            />
          </Modal>
        )}

        {/* Rate Item Modal */}
        {rateItem && (
          <Modal onClose={() => setRateItem(null)} title="Rate Item">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">{rateItem.title}</h3>
              <div className="space-y-3">
                {['Loved', 'Liked', 'Not for me'].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRateItem(rateItem, rating)}
                    disabled={isRateSubmitting}
                    className={`w-full px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      rateValue === rating
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setRateItem(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
