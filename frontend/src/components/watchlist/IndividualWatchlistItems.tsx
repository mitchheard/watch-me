'use client';

import { useEffect, useState } from 'react';
import { WatchItem, WatchlistFormData } from '@/types/watchlist';
import WatchlistForm from './WatchlistForm';
import Modal from '@/components/Modal';
import useWatchlistFilters from '@/hooks/useWatchlistFilters';
import { FilmIcon, TvIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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

interface IndividualWatchlistItemsProps {
  watchlistId: string;
  watchlistName: string;
}

export default function IndividualWatchlistItems({ watchlistId, watchlistName: initialWatchlistName }: IndividualWatchlistItemsProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WatchItem | null>(null);
  const [actualWatchlistName, setActualWatchlistName] = useState(initialWatchlistName);
  const { type, status, updateFilters } = useWatchlistFilters();
  const [hasMounted, setHasMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rateItem, setRateItem] = useState<WatchItem | null>(null);
  const [rateValue, setRateValue] = useState<string | null>(null);
  const [isRateSubmitting, setIsRateSubmitting] = useState(false);
  const [modalStep, setModalStep] = useState<'edit' | 'rate'>('edit');
  const [modalItem, setModalItem] = useState<WatchItem | null>(null);

  const fetchWatchlistName = async () => {
    try {
      const response = await fetch(`/api/watchlists/${watchlistId}`);
      if (response.ok) {
        const watchlist = await response.json();
        setActualWatchlistName(watchlist.name || 'My Watchlist');
      }
    } catch (error) {
      console.error('Failed to fetch watchlist name:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/watchlists/${watchlistId}/items`);
      const data = await res.json();
      
      if (!res.ok) {
        setItems([]);
        return;
      }
      
      setItems(Array.isArray(data) ? data : []);
    } catch (_error) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    fetchWatchlistName();
    fetchItems();
  }, [watchlistId]);

  if (!user) return null;

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this item from your watchlist?')) return;
    const res = await fetch(`/api/watchlists/${watchlistId}/items/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setModalItem(null);
      fetchItems();
      toast.error('Removed from list');
    }
  };

  if (!hasMounted) return <div className="text-slate-500 text-center py-10">Initializing...</div>;
  if (loading) return <div className="text-slate-500 text-center py-10">Loading your watchlist...</div>;

  const visibleItems = items
    .filter((item) => type === 'all' || item.type === type)
    .filter((item) => status === 'all' || item.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate counts for filter badges
  const movieCount = items.filter(item => item.type === 'movie').length;
  const showCount = items.filter(item => item.type === 'show').length;
  const wantToWatchCount = items.filter(item => item.status === 'want-to-watch').length;
  const watchingCount = items.filter(item => item.status === 'watching').length;
  const finishedCount = items.filter(item => item.status === 'finished').length;

  // Dummy handler for onAddItem, as WatchlistForm expects it even in edit mode
  const handleDummyAddItem = async (_newItem: WatchlistFormData) => {
    // This should never be called in edit mode
  };

  const handleEdit = (item: WatchItem) => {
    setModalItem(null);
    setTimeout(() => {
      setSelectedItem(item);
      setModalStep('edit');
    }, 0);
  };

  const handleUpdateItemSuccess = async (updatedItem?: WatchItem) => {
    await fetchItems();
    if (updatedItem && updatedItem.status === 'finished' && !updatedItem.rating) {
      setModalStep('rate');
    } else {
      setSelectedItem(null);
      toast.success(`${getTypeLabel(updatedItem)} updated successfully!`);
    }
  };

  const handleCancelEdit = () => {
    if (selectedItem) setModalItem(selectedItem);
    setSelectedItem(null);
  };

  const handleOpenRateModal = (item: WatchItem) => {
    setModalItem(null);
    setTimeout(() => {
      setRateItem(item);
      setRateValue(item.rating ?? null);
    }, 0);
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = modalStep === 'rate' ? selectedItem : rateItem;
    console.log('handleRateSubmit called', { item, rateValue });
    if (!item) return;
    setIsRateSubmitting(true);
    try {
      await fetch(`/api/watchlists/${watchlistId}/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: rateValue }),
      });
      setSelectedItem(null);
      setRateItem(null);
      setRateValue(null);
      fetchItems();
      toast.success('Rating saved');
    } catch (_err) {
      toast.error('Failed to update rating');
    } finally {
      setIsRateSubmitting(false);
    }
  };

  const handleCancelRate = () => {
    if (rateItem) setModalItem(rateItem);
    setRateItem(null);
    setRateValue(null);
  };

  const getTypeLabel = (item?: WatchItem | null) => {
    if (!item) return 'Item';
    return item.type === 'movie' ? 'Movie' : 'TV Show';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'want-to-watch': return 'bg-blue-100 text-blue-700';
      case 'watching': return 'bg-yellow-100 text-yellow-700';
      case 'finished': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRatingColor = (rating: string | null) => {
    switch (rating) {
      case 'Loved': return 'text-red-600';
      case 'Liked': return 'text-green-600';
      case 'Not for me': return 'text-gray-600';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateFilters('all', status)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            type === 'all' ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All {items.length}
        </button>
        <button
          onClick={() => updateFilters('movie', status)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            type === 'movie' ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Movie {movieCount}
        </button>
        <button
          onClick={() => updateFilters('show', status)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            type === 'show' ? 'bg-white border border-gray-300 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          TV {showCount}
        </button>
      </div>

      {/* Status Sections */}
      {['want-to-watch', 'watching', 'finished'].map((statusKey) => {
        const statusItems = visibleItems.filter(item => item.status === statusKey);
        if (statusItems.length === 0) return null;

        return (
          <motion.div
            key={statusKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {statusKey.replace('-', ' ')} ({statusItems.length})
                </h3>
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {statusItems.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    {/* Poster */}
                    <div className="flex-shrink-0">
                      {item.tmdbPosterPath ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${item.tmdbPosterPath}`}
                          alt={item.title}
                          width={CARD_POSTER_WIDTH}
                          height={CARD_POSTER_HEIGHT}
                          className="rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FilmIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-medium text-gray-900 truncate">
                            {item.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-500">
                              {item.type === 'movie' ? item.tmdbMovieReleaseYear : item.tmdbTvFirstAirYear}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.replace('-', ' ')}
                            </span>
                            {item.rating && (
                              <span className={`text-sm font-medium ${getRatingColor(item.rating)}`}>
                                {item.rating}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => setModalItem(item)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Empty State */}
      {visibleItems.length === 0 && (
        <div className="text-center py-12">
          <FilmIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {items.length === 0 
              ? 'This watchlist is empty. Add some movies or TV shows to get started.'
              : 'Try adjusting your filters to see more items.'
            }
          </p>
        </div>
      )}

      {/* Item Details Modal */}
      {modalItem && (
        <Dialog open={!!modalItem} onClose={() => setModalItem(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start space-x-4">
                  {/* Poster */}
                  <div className="flex-shrink-0">
                    {modalItem.tmdbPosterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w154${modalItem.tmdbPosterPath}`}
                        alt={modalItem.title}
                        width={MODAL_POSTER_WIDTH}
                        height={MODAL_POSTER_HEIGHT}
                        className="rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-30 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FilmIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Dialog.Title className="text-lg font-medium text-gray-900">
                      {modalItem.title}
                    </Dialog.Title>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-500">
                        {modalItem.type === 'movie' ? 'Movie' : 'TV Show'} • {modalItem.type === 'movie' ? modalItem.tmdbMovieReleaseYear : modalItem.tmdbTvFirstAirYear}
                      </p>
                      <p className={`text-sm font-medium ${getStatusColor(modalItem.status)}`}>
                        {modalItem.status.replace('-', ' ')}
                      </p>
                      {modalItem.rating && (
                        <p className={`text-sm font-medium ${getRatingColor(modalItem.rating)}`}>
                          {modalItem.rating}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        Added {new Date(modalItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {modalItem.tmdbOverview && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                        {modalItem.tmdbOverview}
                      </p>
                    )}
                    {modalItem.notes && (
                      <p className="mt-2 text-sm text-gray-600">
                        <strong>Notes:</strong> {modalItem.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => handleEdit(modalItem)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleOpenRateModal(modalItem)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Rate
                  </button>
                  <button
                    onClick={() => handleDelete(modalItem.id)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      )}

      {/* Edit Modal */}
      {selectedItem && (
        <Modal onClose={handleCancelEdit} title={`Edit ${getTypeLabel(selectedItem)}`}>
          <WatchlistForm
            itemToEdit={selectedItem}
            _onAddItem={handleDummyAddItem}
            onUpdateItem={async (id, item) => {
              // Handle update logic here
              await handleUpdateItemSuccess();
            }}
            onCancelEdit={handleCancelEdit}
          />
        </Modal>
      )}

      {/* Rate Modal */}
      {rateItem && (
        <Modal onClose={handleCancelRate} title="Rate This Item">
          <form onSubmit={handleRateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How did you like it?
              </label>
              <div className="space-y-2">
                {['Loved', 'Liked', 'Not for me'].map((rating) => (
                  <label key={rating} className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      value={rating}
                      checked={rateValue === rating}
                      onChange={(e) => setRateValue(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">{rating}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancelRate}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRateSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isRateSubmitting ? 'Saving...' : 'Save Rating'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
