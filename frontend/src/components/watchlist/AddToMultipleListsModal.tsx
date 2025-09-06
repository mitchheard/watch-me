'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/Modal';
import WatchlistPicker from './WatchlistPicker';
import CreateWatchlistModal from './CreateWatchlistModal';

interface WatchlistItem {
  tmdbId: number;
  title: string;
  type: 'movie' | 'tv';
  posterPath?: string;
  releaseYear?: number;
}

interface AddToMultipleListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WatchlistItem | null;
  onSuccess?: () => void;
}

export default function AddToMultipleListsModal({
  isOpen,
  onClose,
  item,
  onSuccess
}: AddToMultipleListsModalProps) {
  const [selectedWatchlistIds, setSelectedWatchlistIds] = useState<string[]>([]);
  const [status, setStatus] = useState('Want to Watch');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSubmit = async () => {
    if (!item || selectedWatchlistIds.length === 0) {
      setError('Please select at least one watchlist');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/watchlists/add-to-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdbId: item.tmdbId,
          watchlistIds: selectedWatchlistIds,
          status,
          rating: rating || null,
          notes: notes.trim() || null,
          title: item.title,
          type: item.type
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item to watchlists');
      }

      const data = await response.json();
      
      // Show success message for each watchlist
      const successMessages = data.results.map((result: any) => {
        if (result.status === 'added') {
          return `✅ Added to "${result.watchlistName}"`;
        } else if (result.status === 'already_exists') {
          return `⚠️ Already in "${result.watchlistName}"`;
        }
        return null;
      }).filter(Boolean);

      if (successMessages.length > 0) {
        console.log('Success:', successMessages.join('\n'));
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to watchlists');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedWatchlistIds([]);
    setStatus('Want to Watch');
    setRating('');
    setNotes('');
    setError(null);
    onClose();
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    // Refresh the watchlist picker by closing and reopening
    // The WatchlistPicker will refetch on mount
  };

  if (!item) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Add to Lists
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Item Preview */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
            {item.posterPath && (
              <img
                src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
                alt={item.title}
                className="w-12 h-18 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500">
                {item.type === 'movie' ? 'Movie' : 'TV Show'}
                {item.releaseYear && ` • ${item.releaseYear}`}
              </p>
            </div>
          </div>

          {/* Watchlist Picker */}
          <div className="mb-6">
            <WatchlistPicker
              selectedWatchlistIds={selectedWatchlistIds}
              onSelectionChange={setSelectedWatchlistIds}
              onCreateNew={handleCreateNew}
            />
          </div>

          {/* Status Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Want to Watch">Want to Watch</option>
              <option value="Watching">Watching</option>
              <option value="Finished">Finished</option>
            </select>
          </div>

          {/* Rating Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating (Optional)
            </label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No rating</option>
              <option value="Loved">Loved</option>
              <option value="Liked">Liked</option>
              <option value="Not for me">Not for me</option>
            </select>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about this item..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || selectedWatchlistIds.length === 0}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Adding...' : `Add to ${selectedWatchlistIds.length} List${selectedWatchlistIds.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Watchlist Modal */}
      <CreateWatchlistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
