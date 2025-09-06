'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import AddToMultipleListsModal from './AddToMultipleListsModal';

interface WatchlistItem {
  id: string;
  status: string;
  rating?: string;
  notes?: string;
  addedAt: string;
  updatedAt: string;
  watchlistItem: {
    id: string;
    title: string;
    type: string;
    tmdbId: number;
    tmdbPosterPath?: string;
    tmdbMovieReleaseYear?: number;
    tmdbTvFirstAirYear?: number;
  };
}

interface WatchlistItemsProps {
  watchlistId: string;
  watchlistName: string;
  className?: string;
}

export default function WatchlistItems({ 
  watchlistId, 
  watchlistName, 
  className = '' 
}: WatchlistItemsProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, [watchlistId]);

  const fetchItems = async () => {
    if (!watchlistId) {
      setError('No watchlist ID provided');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching items for watchlist:', watchlistId);
      const response = await fetch(`/api/watchlists/${watchlistId}/items`);
      if (!response.ok) {
        throw new Error(`Failed to fetch watchlist items: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setItems(data.items);
    } catch (err) {
      console.error('Error fetching watchlist items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlist items');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from the watchlist?')) {
      return;
    }

    try {
      const response = await fetch(`/api/watchlists/${watchlistId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setItems(items.filter(item => item.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleUpdateItem = async (itemId: string, updates: { status?: string; rating?: string; notes?: string }) => {
    try {
      const response = await fetch(`/api/watchlists/${watchlistId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const data = await response.json();
      setItems(items.map(item => 
        item.id === itemId ? { ...item, ...data.item } : item
      ));
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const handleAddSuccess = () => {
    fetchItems(); // Refresh the list
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Want to Watch':
        return 'bg-gray-100 text-gray-800';
      case 'Watching':
        return 'bg-blue-100 text-blue-800';
      case 'Finished':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Loved':
        return 'text-red-600';
      case 'Liked':
        return 'text-green-600';
      case 'Not for me':
        return 'text-gray-600';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {watchlistName} ({items.length} items)
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Item
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Poster */}
              {item.watchlistItem.tmdbPosterPath && (
                <img
                  src={`https://image.tmdb.org/t/p/w92${item.watchlistItem.tmdbPosterPath}`}
                  alt={item.watchlistItem.title}
                  className="w-12 h-18 object-cover rounded flex-shrink-0"
                />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900 truncate">
                      {item.watchlistItem.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.watchlistItem.type === 'movie' ? 'Movie' : 'TV Show'}
                      {(item.watchlistItem.tmdbMovieReleaseYear || item.watchlistItem.tmdbTvFirstAirYear) && 
                        ` • ${item.watchlistItem.tmdbMovieReleaseYear || item.watchlistItem.tmdbTvFirstAirYear}`
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit item"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Remove item"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

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

                {item.notes && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm mb-4">No items in this watchlist</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Add your first item
          </button>
        </div>
      )}

      {/* Add Item Modal */}
      <AddToMultipleListsModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        item={null} // We'll need to implement item selection
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}