'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, PlusIcon } from '@heroicons/react/24/outline';

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

interface WatchlistPickerProps {
  selectedWatchlistIds: string[];
  onSelectionChange: (watchlistIds: string[]) => void;
  onCreateNew?: () => void;
  className?: string;
}

export default function WatchlistPicker({
  selectedWatchlistIds,
  onSelectionChange,
  onCreateNew,
  className = ''
}: WatchlistPickerProps) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleWatchlistToggle = (watchlistId: string) => {
    const isSelected = selectedWatchlistIds.includes(watchlistId);
    if (isSelected) {
      onSelectionChange(selectedWatchlistIds.filter(id => id !== watchlistId));
    } else {
      onSelectionChange([...selectedWatchlistIds, watchlistId]);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded mb-2"></div>
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
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Add to lists:</h3>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <PlusIcon className="h-3 w-3" />
            New List
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {watchlists.map((watchlist) => {
          const isSelected = selectedWatchlistIds.includes(watchlist.id);
          const isShared = watchlist.isShared;
          
          return (
            <button
              key={watchlist.id}
              onClick={() => handleWatchlistToggle(watchlist.id)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                isSelected
                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {watchlist.name}
                    </span>
                    {isShared && (
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
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{watchlist._count.items} items</span>
                    {isShared && (
                      <span>• {watchlist.members.length} members</span>
                    )}
                  </div>
                </div>
                <div className="ml-3 flex-shrink-0">
                  {isSelected && (
                    <CheckIcon className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {watchlists.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No watchlists found</p>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Create your first watchlist
            </button>
          )}
        </div>
      )}
    </div>
  );
}
