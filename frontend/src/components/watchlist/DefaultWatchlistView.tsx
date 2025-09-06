'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WatchItem {
  id: number;
  title: string;
  type: 'movie' | 'tv';
  status: string;
  rating?: string;
  notes?: string;
  tmdbId?: number;
  tmdbPosterPath?: string;
  tmdbOverview?: string;
  tmdbTagline?: string;
  tmdbImdbId?: string;
  tmdbMovieCertification?: string;
  tmdbMovieReleaseYear?: number;
  tmdbMovieRuntime?: number;
  tmdbTvCertification?: string;
  tmdbTvFirstAirYear?: number;
  tmdbTvLastAirYear?: number;
  tmdbTvNetworks?: string;
  tmdbTvNumberOfEpisodes?: number;
  tmdbTvNumberOfSeasons?: number;
  tmdbTvStatus?: string;
  currentSeason?: number;
  totalSeasons?: number;
  createdAt: string;
  updatedAt: string;
}

export default function DefaultWatchlistView() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/watchlist');
      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlist');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your watchlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchWatchlist}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Watchlist</h1>
          <p className="text-gray-600 mt-2">Your personal collection of movies and TV shows</p>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {item.tmdbPosterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${item.tmdbPosterPath}`}
                      alt={item.title}
                      className="w-16 h-24 object-cover rounded shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gray-200 rounded shadow-sm flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">
                          {item.type === 'movie' ? 'Movie' : 'TV Show'}
                        </span>
                        {item.tmdbMovieReleaseYear && (
                          <span className="text-sm text-gray-500">
                            ({item.tmdbMovieReleaseYear})
                          </span>
                        )}
                        {item.tmdbTvFirstAirYear && (
                          <span className="text-sm text-gray-500">
                            ({item.tmdbTvFirstAirYear})
                          </span>
                        )}
                      </div>
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
            <p className="text-sm mb-4">No items in your watchlist</p>
            <a
              href="/recommendations"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Get recommendations
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
