'use client';

import { useEffect, useState } from 'react';
import { WatchItem, WatchlistFormData } from '@/types/watchlist';
// import EditWatchItemModal from './EditWatchItemModal'; // Temporarily disable EditWatchItemModal
import WatchlistForm from './WatchlistForm'; // Import our test form
import Modal from '@/components/Modal'; // Import Modal for WatchlistForm
import useWatchlistFilters from '@/hooks/useWatchlistFilters';
import { FilmIcon, TvIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Dialog } from '@headlessui/react';

// type FilterType = 'all' | 'movie' | 'show';
type FilterStatus = 'all' | 'want-to-watch' | 'watching' | 'finished';

// Define poster sizes for card and modal (2:3 aspect ratio)
const CARD_POSTER_WIDTH = 56;
const CARD_POSTER_HEIGHT = 84;
const MODAL_POSTER_WIDTH = 80;
const MODAL_POSTER_HEIGHT = 120;

export default function WatchlistItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WatchItem | null>(null); // This will be itemToEdit for WatchlistForm
  // No need for isEditModalOpen, selectedItem existing will trigger the modal with WatchlistForm
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this item from your watchlist?')) return;
    const res = await fetch(`/api/watchlist?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setModalItem(null); // Close details modal after delete
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

  // Dummy handler for onAddItem, as WatchlistForm expects it even in edit mode
  const handleDummyAddItem = async (_newItem: WatchlistFormData) => {
    // This should never be called in edit mode
  };

  const handleEdit = (item: WatchItem) => {
    setModalItem(null); // Close details modal first
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
      setSelectedItem(null); // Close modal
      toast.success(`${getTypeLabel(updatedItem)} updated successfully!`);
    }
  };

  const handleCancelEdit = () => {
    if (selectedItem) setModalItem(selectedItem); // Reopen details modal
    setSelectedItem(null); // Close edit modal
  };

  const handleOpenRateModal = (item: WatchItem) => {
    setModalItem(null); // Close details modal first
    setTimeout(() => {
      setRateItem(item);
      setRateValue(item.rating ?? null);
    }, 0);
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Use selectedItem if modalStep === 'rate', otherwise use rateItem
    const item = modalStep === 'rate' ? selectedItem : rateItem;
    console.log('handleRateSubmit called', { item, rateValue });
    if (!item) return;
    setIsRateSubmitting(true);
    try {
      await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, rating: rateValue }),
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

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchItems();
    toast.success('Added to list');
  };

  // Helper function to get label
  function getTypeLabel(item: WatchItem | null | undefined): string {
    if (!item) return 'Item';
    if (item.type === 'movie') return 'Movie';
    if (item.type === 'show') return 'TV Show';
    return 'Item';
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Responsive Filter Bar: Type buttons always in a row, 'TV' label for compactness */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-stretch mb-4 mt-2 gap-2">
        <div className="flex flex-row gap-1 bg-slate-100 rounded-lg p-1 h-full w-full sm:w-auto">
          <button
            onClick={() => updateFilters('all', status)}
            className={`px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-sm rounded-md font-medium flex items-center transition-all h-full w-full sm:w-auto justify-center border border-slate-200 ${type === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 bg-white/70 hover:bg-slate-100'}`}
          >
            All
          </button>
          <button
            onClick={() => updateFilters('movie', status)}
            className={`px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-sm rounded-md font-medium flex items-center transition-all h-full w-full sm:w-auto justify-center border border-slate-200 ${type === 'movie' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 bg-white/70 hover:bg-slate-100'}`}
          >
            <span className="mr-1">🎬</span> Movies
          </button>
          <button
            onClick={() => updateFilters('show', status)}
            className={`px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-sm rounded-md font-medium flex items-center transition-all h-full w-full sm:w-auto justify-center border border-slate-200 ${type === 'show' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 bg-white/70 hover:bg-slate-100'}`}
          >
            <span className="mr-1">📺</span> TV
          </button>
        </div>
        <div className="flex items-stretch w-full sm:w-auto mt-2 sm:mt-0">
          <label htmlFor="status-filter" className="sr-only">Status</label>
          <select
            id="status-filter"
            value={status}
            onChange={e => updateFilters(type, e.target.value as FilterStatus)}
            className="rounded-md border border-gray-300 px-3 py-2 pr-8 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm w-full sm:w-auto h-full bg-[url('data:image/svg+xml;utf8,<svg fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'></path></svg>')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25em_1.25em]"
          >
            <option value="all">All Statuses</option>
            <option value="want-to-watch">Want to Watch</option>
            <option value="watching">Watching</option>
            <option value="finished">Finished</option>
          </select>
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <motion.ul layout className="space-y-3">
          {visibleItems.map((item) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`rounded-lg p-4 transition-shadow hover:shadow-md relative min-h-[80px] border-2
                ${item.type === 'movie' ? 'bg-slate-50 border-slate-200' : 'bg-indigo-50 border-indigo-200'}
              `}
              onClick={() => setModalItem(item)}
            >
              <div className="flex items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col flex-grow min-w-0">
                    <span className="font-semibold text-base block">{item.title}</span>
                    <div className="flex flex-row gap-3 mt-1">
                      {item.tmdbPosterPath ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${item.tmdbPosterPath}`}
                          alt={`${item.title} poster`}
                          width={CARD_POSTER_WIDTH}
                          height={CARD_POSTER_HEIGHT}
                          className="rounded flex-shrink-0 shadow-sm object-cover border border-slate-200"
                          style={{ aspectRatio: '2/3', width: CARD_POSTER_WIDTH, height: CARD_POSTER_HEIGHT }}
                          unoptimized
                        />
                      ) : (
                        <Image
                          src="/no-image.svg"
                          alt="No poster available"
                          width={CARD_POSTER_WIDTH}
                          height={CARD_POSTER_HEIGHT}
                          className="rounded flex-shrink-0 shadow-sm bg-slate-200 object-cover border border-slate-200"
                          style={{ aspectRatio: '2/3', width: CARD_POSTER_WIDTH, height: CARD_POSTER_HEIGHT }}
                          unoptimized
                        />
                      )}
                      <div className="flex flex-col flex-grow min-w-0">
                        <div className="flex items-center gap-1 text-slate-500 text-xs mb-0.5">
                          {item.type === 'movie' ? (
                            <FilmIcon className="w-4 h-4 text-slate-400" />
                          ) : (
                            <TvIcon className="w-4 h-4 text-indigo-400" />
                          )}
                          <span>
                            {item.type === 'movie' ? 'Movie' : 'TV Show'}
                            {(item.type === 'movie' && item.tmdbMovieReleaseYear) || (item.type === 'show' && item.tmdbTvFirstAirYear) ? (
                              <>
                                {' '}
                                {item.type === 'movie' && item.tmdbMovieReleaseYear && (
                                  <span>({item.tmdbMovieReleaseYear})</span>
                                )}
                                {item.type === 'show' && item.tmdbTvFirstAirYear && item.tmdbTvLastAirYear && (
                                  <span>({item.tmdbTvFirstAirYear}–{item.tmdbTvLastAirYear})</span>
                                )}
                                {item.type === 'show' && item.tmdbTvFirstAirYear && !item.tmdbTvLastAirYear && (
                                  <span>({item.tmdbTvFirstAirYear})</span>
                                )}
                              </>
                            ) : null}
                          </span>
                        </div>
                        {/* Season info for shows */}
                        {item.type === 'show' && item.currentSeason && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Season {item.currentSeason}
                            {item.totalSeasons ? ` of ${item.totalSeasons}` : ''}
                          </p>
                        )}
                        {/* Status badge */}
                        <div className="mt-1">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full 
                              ${item.status === 'want-to-watch' ? 'bg-blue-100 text-blue-700' :
                                item.status === 'watching' ? 'bg-yellow-100 text-yellow-700' :
                                item.status === 'finished' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-700' 
                              }`}
                          >
                            {item.status === 'want-to-watch' ? 'Want to Watch' : item.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        {/* Rating badge */}
                        <div className="mt-1">
                          {item.rating === 'loved' && (
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-pink-100 text-pink-700">Loved</span>
                          )}
                          {item.rating === 'liked' && (
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Liked</span>
                          )}
                          {item.rating === 'not-for-me' && (
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-600">Not for me</span>
                          )}
                          {!item.rating && (
                            <span className="inline-block px-2 py-0.5 text-xs font-normal rounded-full bg-slate-50 text-slate-400">Not rated</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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

      {/* Floating Action Button (FAB) for Add - only one instance, outside the card list */}
      <button
        className="fixed bottom-20 right-6 z-50 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
        aria-label="Add movie or TV show"
        onClick={() => setShowAddModal(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Render WatchlistForm in a Modal when selectedItem is set (for editing) */}
      {selectedItem && (
        <Modal 
          onClose={() => setSelectedItem(null)} 
          title={modalStep === 'edit' ? 'Edit Item' : (selectedItem.type === 'show' ? 'Rate TV Show' : 'Rate Movie')}
        >
          {modalStep === 'edit' && (
            <WatchlistForm 
              itemToEdit={selectedItem} 
              _onAddItem={handleDummyAddItem}
              onUpdateItem={async (id, data) => {
                // After update, fetch the updated item to check status/rating
                await fetch('/api/watchlist', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...data, id }),
                });
                const res = await fetch(`/api/watchlist?id=${id}`);
                const updated = await res.json();
                console.log('Updated item after edit:', updated);
                handleUpdateItemSuccess(updated);
              }}
              onCancelEdit={handleCancelEdit}
              onAddSuccess={() => {
                setSelectedItem(null);
                toast.success(`${getTypeLabel(selectedItem)} updated successfully!`);
                fetchItems();
              }}
            />
          )}
          {modalStep === 'rate' && selectedItem && (
            <form onSubmit={handleRateSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-medium text-slate-700 mb-2 text-center">Rating</label>
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition w-full
                      ${rateValue === 'loved' ? 'bg-green-50 border-green-300 ring-2 ring-green-400' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <input
                      type="radio"
                      name="rating"
                      value="loved"
                      checked={rateValue === 'loved'}
                      onChange={() => setRateValue('loved')}
                      className="form-radio text-green-600 w-5 h-5"
                    />
                    <span className="text-2xl">👍👍</span>
                    <span className="font-semibold text-green-700">I loved it</span>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition w-full
                      ${rateValue === 'liked' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <input
                      type="radio"
                      name="rating"
                      value="liked"
                      checked={rateValue === 'liked'}
                      onChange={() => setRateValue('liked')}
                      className="form-radio text-blue-600 w-5 h-5"
                    />
                    <span className="text-2xl">👍</span>
                    <span className="font-semibold text-blue-700">I liked it</span>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition w-full
                      ${rateValue === 'not-for-me' ? 'bg-red-50 border-red-300 ring-2 ring-red-400' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <input
                      type="radio"
                      name="rating"
                      value="not-for-me"
                      checked={rateValue === 'not-for-me'}
                      onChange={() => setRateValue('not-for-me')}
                      className="form-radio text-red-600 w-5 h-5"
                    />
                    <span className="text-2xl">👎</span>
                    <span className="font-semibold text-red-700">Wasn&apos;t for me</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedItem) setModalItem(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedItem) return;
                    setIsRateSubmitting(true);
                    try {
                      await fetch('/api/watchlist', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: selectedItem.id, rating: null }),
                      });
                      setSelectedItem(null);
                      setRateValue(null);
                      fetchItems();
                      toast.success('Rating cleared!');
                    } catch (_err) {
                      toast.error('Failed to clear rating');
                    } finally {
                      setIsRateSubmitting(false);
                    }
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={isRateSubmitting || !rateValue}
                >
                  Clear Rating
                </button>
                <button
                  type="submit"
                  disabled={isRateSubmitting || !rateValue}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isRateSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Render WatchlistForm in a Modal when showAddModal is set (for adding) */}
      {showAddModal && (
        <Modal
          onClose={() => setShowAddModal(false)}
          title="Add Movie or TV Show"
        >
          <WatchlistForm
            _onAddItem={async () => {}}
            onAddSuccess={handleAddSuccess}
          />
        </Modal>
      )}

      {/* Rate Modal */}
      {rateItem && (
        <Dialog open={!!rateItem} onClose={() => {
          if (rateItem) setModalItem(rateItem);
          setRateItem(null);
          setRateValue(null);
        }} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="flex items-end sm:items-center justify-center min-h-screen px-2 sm:px-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto p-6 sm:p-8 z-10 transition-all duration-200 scale-100">
              <button
                type="button"
                onClick={() => {
                  if (rateItem) setModalItem(rateItem);
                  setRateItem(null);
                  setRateValue(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 focus:outline-none"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <Dialog.Title className="text-xl font-bold mb-4 text-center">
                {rateItem.type === 'show' ? 'Rate TV Show' : 'Rate Movie'}
              </Dialog.Title>
              <form onSubmit={handleRateSubmit} className="space-y-6">
                <div>
                  <label className="block text-base font-medium text-slate-700 mb-2 text-center">Rating</label>
                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition w-full
                        ${rateValue === 'loved' ? 'bg-green-50 border-green-300 ring-2 ring-green-400' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <input
                        type="radio"
                        name="rating"
                        value="loved"
                        checked={rateValue === 'loved'}
                        onChange={() => setRateValue('loved')}
                        className="form-radio text-green-600 w-5 h-5"
                      />
                      <span className="text-2xl">👍👍</span>
                      <span className="font-semibold text-green-700">I loved it</span>
                    </label>
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition w-full
                        ${rateValue === 'liked' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <input
                        type="radio"
                        name="rating"
                        value="liked"
                        checked={rateValue === 'liked'}
                        onChange={() => setRateValue('liked')}
                        className="form-radio text-blue-600 w-5 h-5"
                      />
                      <span className="text-2xl">👍</span>
                      <span className="font-semibold text-blue-700">I liked it</span>
                    </label>
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition w-full
                        ${rateValue === 'not-for-me' ? 'bg-red-50 border-red-300 ring-2 ring-red-400' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <input
                        type="radio"
                        name="rating"
                        value="not-for-me"
                        checked={rateValue === 'not-for-me'}
                        onChange={() => setRateValue('not-for-me')}
                        className="form-radio text-red-600 w-5 h-5"
                      />
                      <span className="text-2xl">👎</span>
                      <span className="font-semibold text-red-700">Wasn&apos;t for me</span>
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (rateItem) setModalItem(rateItem);
                      setRateItem(null);
                      setRateValue(null);
                    }}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!rateItem) return;
                      setIsRateSubmitting(true);
                      try {
                        await fetch('/api/watchlist', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: rateItem.id, rating: null }),
                        });
                        setRateItem(null);
                        setRateValue(null);
                        fetchItems();
                        toast.success('Rating cleared!');
                      } catch (_err) {
                        toast.error('Failed to clear rating');
                      } finally {
                        setIsRateSubmitting(false);
                      }
                    }}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={isRateSubmitting || !rateValue}
                  >
                    Clear Rating
                  </button>
                  <button
                    type="submit"
                    disabled={isRateSubmitting || !rateValue}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isRateSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Dialog>
      )}

      {/* Modal for bottom sheet/modal */}
      {modalItem && (
        <Dialog open={!!modalItem} onClose={() => setModalItem(null)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="flex items-end sm:items-center justify-center min-h-screen px-2 sm:px-4">
            <Dialog.Panel
              className="
                fixed bottom-0 left-0 right-0 w-full rounded-t-2xl
                sm:static sm:mx-auto sm:my-16 sm:rounded-2xl sm:max-w-lg
                bg-white shadow-2xl p-6 sm:p-8 z-10 transition-all duration-200 scale-100
              "
            >
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 focus:outline-none"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Modal content: poster, title, year, platform, season, status, rating, added, tagline, overview, actions */}
              <div className="flex gap-4 mb-4">
                <div className="flex flex-col items-center mr-4">
                  {modalItem.tmdbPosterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w154${modalItem.tmdbPosterPath}`}
                      alt={`${modalItem.title} poster`}
                      width={MODAL_POSTER_WIDTH}
                      height={MODAL_POSTER_HEIGHT}
                      className="rounded shadow object-cover border border-slate-200"
                      style={{ aspectRatio: '2/3', width: MODAL_POSTER_WIDTH, height: MODAL_POSTER_HEIGHT }}
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/no-image.svg"
                      alt="No poster available"
                      width={MODAL_POSTER_WIDTH}
                      height={MODAL_POSTER_HEIGHT}
                      className="rounded shadow bg-slate-200 object-cover border border-slate-200"
                      style={{ aspectRatio: '2/3', width: MODAL_POSTER_WIDTH, height: MODAL_POSTER_HEIGHT }}
                      unoptimized
                    />
                  )}
                  {modalItem.tmdbTvNetworks && (
                    <div className="mt-2 text-xs text-slate-400 text-center max-w-[90px] truncate">{modalItem.tmdbTvNetworks}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">{modalItem.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-1">
                    {modalItem.type === 'movie' ? (
                      <FilmIcon className="w-5 h-5 text-slate-400" />
                    ) : (
                      <TvIcon className="w-5 h-5 text-indigo-400" />
                    )}
                    <span>
                      {modalItem.type === 'movie' ? 'Movie' : 'TV Show'}
                      {(modalItem.type === 'movie' && modalItem.tmdbMovieReleaseYear) || (modalItem.type === 'show' && modalItem.tmdbTvFirstAirYear) ? (
                        <>
                          {' '}
                          {modalItem.type === 'movie' && modalItem.tmdbMovieReleaseYear && (
                            <span>({modalItem.tmdbMovieReleaseYear})</span>
                          )}
                          {modalItem.type === 'show' && modalItem.tmdbTvFirstAirYear && modalItem.tmdbTvLastAirYear && (
                            <span>({modalItem.tmdbTvFirstAirYear}–{modalItem.tmdbTvLastAirYear})</span>
                          )}
                          {modalItem.type === 'show' && modalItem.tmdbTvFirstAirYear && !modalItem.tmdbTvLastAirYear && (
                            <span>({modalItem.tmdbTvFirstAirYear})</span>
                          )}
                        </>
                      ) : null}
                    </span>
                  </div>
                  {/* Season info for shows */}
                  {modalItem.type === 'show' && modalItem.currentSeason && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Season {modalItem.currentSeason}
                      {modalItem.totalSeasons ? ` of ${modalItem.totalSeasons}` : ''}
                    </p>
                  )}
                  {/* Status badge */}
                  <div className="mt-1">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full 
                        ${modalItem.status === 'want-to-watch' ? 'bg-blue-100 text-blue-700' :
                          modalItem.status === 'watching' ? 'bg-yellow-100 text-yellow-700' :
                          modalItem.status === 'finished' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700' 
                        }`}
                    >
                      {modalItem.status === 'want-to-watch' ? 'Want to Watch' : modalItem.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  {/* Rating badge */}
                  <div className="mt-1">
                    {modalItem.rating === 'loved' && (
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-pink-100 text-pink-700">Loved</span>
                    )}
                    {modalItem.rating === 'liked' && (
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Liked</span>
                    )}
                    {modalItem.rating === 'not-for-me' && (
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-600">Not for me</span>
                    )}
                    {!modalItem.rating && (
                      <span className="inline-block px-2 py-0.5 text-xs font-normal rounded-full bg-slate-50 text-slate-400">Not rated</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Added date above tagline/overview */}
              {modalItem.createdAt && (
                <div className="mt-2 text-xs text-slate-400">
                  Added: {new Date(modalItem.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              )}
              {modalItem.tmdbTagline && (
                <div className="mb-1 italic text-slate-500 text-sm">{modalItem.tmdbTagline}</div>
              )}
              {modalItem.tmdbOverview && (
                <div className="mb-1 text-slate-700 text-sm">{modalItem.tmdbOverview}</div>
              )}
              {/* Actions row */}
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  className="px-3 py-1 rounded bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200"
                  onClick={() => handleEdit(modalItem)}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 rounded bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200"
                  onClick={() => handleOpenRateModal(modalItem)}
                >
                  Rate
                </button>
                <button
                  className="px-3 py-1 rounded bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200"
                  onClick={() => handleDelete(modalItem.id)}
                >
                  Remove
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
}