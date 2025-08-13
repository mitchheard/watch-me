'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WatchItem } from '@/types/watchlist';
import { SparklesIcon, ClockIcon, HeartIcon, EyeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Recommendation {
  id: number;
  title: string;
  type: string;
  status: string;
  reason: string;
  confidence: number;
  tmdbPosterPath?: string | null;
  tmdbOverview?: string | null;
  tmdbMovieReleaseYear?: number | null;
  tmdbTvFirstAirYear?: number | null;
  tmdbMovieRuntime?: number | null;
  tmdbTvNumberOfSeasons?: number | null;
}

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRecommendations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/recommendations', {
        credentials: 'include', // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'want-to-watch': return 'bg-blue-100 text-blue-700';
      case 'watching': return 'bg-yellow-100 text-yellow-700';
      case 'finished': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'want-to-watch': return 'Want to Watch';
      case 'watching': return 'Watching';
      case 'finished': return 'Finished';
      default: return status;
    }
  };

  const getYear = (item: Recommendation) => {
    return item.tmdbMovieReleaseYear || item.tmdbTvFirstAirYear;
  };

  const getRuntime = (item: Recommendation) => {
    if (item.type === 'movie' && item.tmdbMovieRuntime) {
      return `${item.tmdbMovieRuntime} min`;
    }
    if (item.type === 'show' && item.tmdbTvNumberOfSeasons) {
      return `${item.tmdbTvNumberOfSeasons} season${item.tmdbTvNumberOfSeasons > 1 ? 's' : ''}`;
    }
    return null;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Please sign in to view recommendations.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <SparklesIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">What Should I Watch?</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Based on your watchlist and preferences, here are 5 things you should watch next.
        </p>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={fetchRecommendations}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <SparklesIcon className="h-5 w-5" />
          {isLoading ? 'Generating Recommendations...' : 'Get New Recommendations'}
        </button>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Recommendations */}
      {!isLoading && !error && recommendations.length > 0 && (
        <div className="space-y-6">
          {recommendations.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row">
                {/* Poster */}
                <div className="md:w-48 md:flex-shrink-0">
                  <div className="relative h-64 md:h-full">
                    {item.tmdbPosterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${item.tmdbPosterPath}`}
                        alt={item.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/no-image.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-gray-900">#{index + 1}</span>
                        <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">
                          {item.type}
                        </span>
                        {getYear(item) && (
                          <span className="text-sm text-gray-500">
                            {getYear(item)}
                          </span>
                        )}
                        {getRuntime(item) && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {getRuntime(item)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Confidence Score */}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <HeartIcon className="h-4 w-4" />
                      <span>{Math.round(item.confidence * 100)}% match</span>
                    </div>
                  </div>

                  {/* Overview */}
                  {item.tmdbOverview && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {item.tmdbOverview}
                    </p>
                  )}

                  {/* Reason */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <EyeIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-blue-900 mb-1">Why this recommendation?</h3>
                        <p className="text-blue-800 text-sm">{item.reason}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && recommendations.length === 0 && (
        <div className="text-center py-12">
          <SparklesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
          <p className="text-gray-600 mb-6">
            Add some items to your watchlist to get personalized recommendations.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Watchlist
          </a>
        </div>
      )}
    </div>
  );
}
