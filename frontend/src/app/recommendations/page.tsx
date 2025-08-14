'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// import { WatchItem } from '@/types/watchlist'; // Unused import
import { SparklesIcon, ClockIcon, HeartIcon, EyeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

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
  createdAt?: string | null;
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
  totalItems: number;
  strategy?: string;
  strategyFocus?: string;
}

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [strategy, setStrategy] = useState<string>('');
  const [strategyFocus, setStrategyFocus] = useState<string>('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  
  // Debug logging for state changes
  useEffect(() => {
    console.log('Recommendations state changed:', recommendations.length);
  }, [recommendations]);

  const fetchRecommendations = useCallback(async (resetState = false) => {
    if (!user) return;
    
    console.log('Fetching recommendations...', resetState ? '(manual refresh)' : '(initial load)');
    setIsLoading(true);
    setError(null);
    
    if (resetState) {
      setRecommendations([]);
      setStrategy('');
      setStrategyFocus('');
      setLastUpdated(null);
    }
    
    try {
      const response = await fetch('/api/recommendations', {
        credentials: 'include', // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data: RecommendationsResponse = await response.json();
      console.log('Received recommendations:', data.recommendations.length);
      setRecommendations(data.recommendations);
      setStrategy(data.strategy || '');
      setStrategyFocus(data.strategyFocus || '');
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !hasInitialized) {
      setHasInitialized(true);
      fetchRecommendations();
    }
  }, [user, hasInitialized, fetchRecommendations]); // Include user in dependencies

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

  const toggleDescription = (id: number) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const updateItemStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id,
          status: newStatus,
        }),
      });
      
      if (response.ok) {
        // Update local state to reflect the change
        setRecommendations(prev => 
          prev.map(item => 
            item.id === id ? { ...item, status: newStatus } : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Please sign in to view recommendations.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
      {/* Compact Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <SparklesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">What Should I Watch?</h1>
        </div>
        <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Based on your watchlist and preferences, here are 5 things you should watch next.
        </p>
      </div>

      {/* Compact Refresh Button */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <button
          onClick={() => fetchRecommendations(true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        >
          <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          {isLoading ? 'Generating...' : 'Get New Recommendations'}
        </button>
      </div>

      {/* Compact Strategy and Last Updated */}
      {(strategy || lastUpdated) && (
        <div className="text-center mb-4 sm:mb-6 space-y-1 sm:space-y-2">
          {strategy && (
            <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
              <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              {strategy.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Strategy
            </div>
          )}
          {strategyFocus && (
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto px-2">
              {strategyFocus}
            </p>
          )}
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-red-700 text-sm sm:text-base">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Recommendations */}
      {!isLoading && !error && recommendations.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {recommendations.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Poster */}
                <div className="sm:w-48 sm:flex-shrink-0">
                  <div className="relative h-48 sm:h-full">
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
                <div className="flex-1 p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <span className="text-lg sm:text-2xl font-bold text-gray-900">#{index + 1}</span>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{item.title}</h2>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 capitalize">
                          {item.type}
                        </span>
                        {/* Combined year and seasons info like in watchlist */}
                        {(getYear(item) || getRuntime(item)) && (
                          <span className="text-xs sm:text-sm text-gray-500">
                            {item.type === 'show' && item.tmdbTvNumberOfSeasons ? (
                              <>
                                {item.tmdbTvNumberOfSeasons} {item.tmdbTvNumberOfSeasons === 1 ? 'season' : 'seasons'}
                                {getYear(item) && (
                                  <>
                                    {' • '}
                                    {getYear(item)}
                                  </>
                                )}
                              </>
                            ) : (
                              getYear(item)
                            )}
                          </span>
                        )}
                      </div>
                      
                      {/* Date added - subtle */}
                      {item.createdAt && (
                        <p className="text-xs text-gray-400 mb-2">
                          Added {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    {/* Confidence Score */}
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 flex-shrink-0">
                      <HeartIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{Math.round(item.confidence * 100)}% match</span>
                    </div>
                  </div>

                  {/* Overview with expandable description */}
                  {item.tmdbOverview && (
                    <div className="mb-3 sm:mb-4">
                      <p className={`text-gray-600 text-sm sm:text-base ${expandedDescriptions.has(item.id) ? '' : 'line-clamp-2 sm:line-clamp-3'}`}>
                        {item.tmdbOverview}
                      </p>
                      {item.tmdbOverview.length > 150 && (
                        <button
                          onClick={() => toggleDescription(item.id)}
                          className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium mt-1"
                        >
                          {expandedDescriptions.has(item.id) ? 'See less' : 'See more'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reason */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-2">
                      <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-blue-900 mb-1 text-sm sm:text-base">Why this recommendation?</h3>
                        <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">{item.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Call to Action */}
                  {item.status === 'want-to-watch' && (
                    <div className="mt-3 sm:mt-4">
                      <button
                        onClick={() => updateItemStatus(item.id, 'watching')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Start Watching
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && recommendations.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <SparklesIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            Add some items to your watchlist to get personalized recommendations.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Go to Watchlist
          </Link>
        </div>
      )}
    </div>
  );
}
