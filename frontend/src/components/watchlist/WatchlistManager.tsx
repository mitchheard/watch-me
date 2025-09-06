'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ShareIcon, EyeIcon } from '@heroicons/react/24/outline';
import CreateWatchlistModal from './CreateWatchlistModal';
import Link from 'next/link';

interface Watchlist {
  id: string;
  name: string;
  description?: string;
  isShared: boolean;
  isDefault: boolean;
  owner: {
    id: string;
    email: string;
  };
  members: Array<{
    user: {
      id: string;
      email: string;
    };
  }>;
  _count: {
    items: number;
  };
}

interface WatchlistManagerProps {
  className?: string;
}

export default function WatchlistManager({ className = '' }: WatchlistManagerProps) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/watchlists');
      if (!response.ok) {
        throw new Error('Failed to fetch watchlists');
      }
      const data = await response.json();
      setWatchlists(data.watchlists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchWatchlists(); // Refresh the list
  };

  const handleDeleteWatchlist = async (watchlistId: string) => {
    if (!confirm('Are you sure you want to delete this watchlist? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/watchlists/${watchlistId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete watchlist');
      }

      setWatchlists(watchlists.filter(w => w.id !== watchlistId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete watchlist');
    }
  };

  const handleShareWatchlist = async (watchlist: Watchlist) => {
    // TODO: Implement sharing functionality
    console.log('Share watchlist:', watchlist);
    alert('Sharing functionality coming soon!');
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded mb-3"></div>
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
        <h2 className="text-lg font-semibold text-gray-900">My Watchlists</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          New List
        </button>
      </div>

      <div className="space-y-3">
        {watchlists.map((watchlist) => (
          <div
            key={watchlist.id}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {watchlist.name}
                  </h3>
                  {watchlist.isShared && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Shared
                    </span>
                  )}
                  {watchlist.isDefault && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Default
                    </span>
                  )}
                </div>
                
                {watchlist.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {watchlist.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{watchlist._count.items} items</span>
                  {watchlist.isShared && (
                    <span>{watchlist.members.length} members</span>
                  )}
                  <span>Created by {watchlist.owner.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-4">
                <Link
                  href={`/watchlists/${watchlist.id}`}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="View watchlist"
                >
                  <EyeIcon className="h-4 w-4" />
                </Link>
                
                {watchlist.isShared && (
                  <button
                    onClick={() => handleShareWatchlist(watchlist)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Share watchlist"
                  >
                    <ShareIcon className="h-4 w-4" />
                  </button>
                )}
                
                <button
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Edit watchlist"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                
                {!watchlist.isDefault && (
                  <button
                    onClick={() => handleDeleteWatchlist(watchlist.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete watchlist"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {watchlists.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm mb-4">No watchlists found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Create your first watchlist
          </button>
        </div>
      )}

      {/* Create Watchlist Modal */}
      <CreateWatchlistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
