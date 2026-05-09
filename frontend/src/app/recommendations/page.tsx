'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// import { WatchItem } from '@/types/watchlist'; // Unused import
import { SparklesIcon, ClockIcon, HeartIcon, EyeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { trackUmamiEvent } from '@/lib/umami-bootstrap';
import {
  RecommendationsDebugToolbar,
  type RecommendationsDebugPayload,
} from './RecommendationsDebugToolbar';
import { isFallbackPhase } from './analytics';

const showRecDebugUi = process.env.NEXT_PUBLIC_SHOW_RECOMMENDATIONS_DEBUG === 'true';

interface Recommendation {
  id: string; // Changed from number to string for CUID
  title: string;
  type: string;
  status: string;
  rating?: string | null;
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
  phase?: string;
  debug?: RecommendationsDebugPayload;
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
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [loadingStage, setLoadingStage] = useState(0);
  const [debugPayload, setDebugPayload] = useState<RecommendationsDebugPayload | null>(null);
  
  // Debug logging for state changes (removed to improve performance)

  const fetchRecommendations = useCallback(async (resetState = false) => {
    if (!user) return;
    
    // Fetching recommendations...
    setIsLoading(true);
    setLoadingStage(0);
    setError(null);
    
    if (resetState) {
      setRecommendations([]);
      setStrategy('');
      setStrategyFocus('');
      setLastUpdated(null);
      setDebugPayload(null);
    }
    
    // Simulate progress stages with better timing
    const progressInterval = setInterval(() => {
      setLoadingStage(prev => {
        const next = prev + 1;
        if (next >= 4) { // Add one more stage for "Finalizing"
          clearInterval(progressInterval);
          return 4; // Stop at 100%
        }
        return next;
      });
    }, 800); // Slower progression to match actual API timing
    
    try {
      trackUmamiEvent('ai_recommendation_requested');

      const url = resetState ? '/api/recommendations?refresh=true' : '/api/recommendations';
      const response = await fetch(url, {
        credentials: 'include', // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data: RecommendationsResponse = await response.json();
      
      // Clear interval immediately when data is received
      clearInterval(progressInterval);
      if (isFallbackPhase(data.phase)) {
        trackUmamiEvent('ai_fallback_fired', { reason: data.phase });
      }
      
      // Update data immediately - no artificial delay
      setRecommendations(data.recommendations);
      setStrategy(data.strategy || '');
      setStrategyFocus(data.strategyFocus || '');
      setDebugPayload(data.debug ?? null);
      setLastUpdated(new Date());
      setIsLoading(false);
      setLoadingStage(0);
      
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDebugPayload(null);
      setIsLoading(false);
      setLoadingStage(0);
    }
  }, [user]);

  useEffect(() => {
    if (user && !hasInitialized) {
      setHasInitialized(true);
      fetchRecommendations();
    }
  }, [user, hasInitialized, fetchRecommendations]); // Include fetchRecommendations to satisfy ESLint

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

  const toggleDescription = (id: string) => {
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

  const updateItemStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'PUT',
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

      {/* Strategy Info */}
      {(strategy || lastUpdated) && (
        <div className="text-center mb-4 sm:mb-6 space-y-2">
          {strategy && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <SparklesIcon className="h-4 w-4" />
              {strategy.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Strategy
            </div>
          )}
          {strategyFocus && (
            <p className="text-sm text-gray-600 max-w-2xl mx-auto px-4">
              {strategyFocus}
            </p>
          )}
          {lastUpdated && (
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <ClockIcon className="h-3 w-3" />
              <span>Updated {lastUpdated.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {showRecDebugUi && (
        <div className="mb-4 max-w-2xl mx-auto px-1">
          <RecommendationsDebugToolbar debug={debugPayload} />
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
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-4">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Generating recommendations...</span>
              <span className="text-sm text-gray-500">{Math.round((loadingStage / 4) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(loadingStage / 4) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <SparklesIcon className="h-4 w-4 animate-pulse" />
            <span>
              {loadingStage === 0 && "Analyzing your watchlist..."}
              {loadingStage === 1 && "Selecting best strategy..."}
              {loadingStage === 2 && "Generating personalized recommendations..."}
              {loadingStage === 3 && "Finalizing your picks..."}
              {loadingStage === 4 && "Almost ready..."}
            </span>
          </div>
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
                  <div className="relative h-56 sm:h-full overflow-hidden rounded-l-lg sm:rounded-l-none sm:rounded-t-lg">
                    {item.tmdbPosterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w342${item.tmdbPosterPath}`}
                        alt={item.title}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 640px) 100vw, 192px"
                        priority={index < 2}
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
                    
                    {/* Confidence Score - Overlay on Poster */}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <HeartIcon className="h-3 w-3" />
                        <span>{Math.round(item.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-6">
                  <div className="mb-2 sm:mb-3">
                    {/* Title */}
                    <div className="flex items-baseline gap-2 sm:gap-3">
                      <span className="text-lg sm:text-2xl font-bold text-gray-900 flex-shrink-0">#{index + 1}</span>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{item.title}</h2>
                    </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        <span className={`text-xs sm:text-sm font-medium inline-flex items-center gap-1 ${
                          item.type === 'movie' 
                            ? 'text-purple-600' 
                            : 'text-emerald-600'
                        }`}>
                          {item.type === 'movie' ? (
                            <>
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                              </svg>
                              Movie
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5l-1 1v2h8v-2l-1-1h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H3V5h18v10z"/>
                              </svg>
                              TV
                            </>
                          )}
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
                        {/* Rating pill inline with other metadata */}
                        {item.rating && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            item.rating === 'loved' ? 'bg-pink-100 text-pink-700' :
                            item.rating === 'liked' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.rating === 'loved' ? '❤️ Loved' : 
                             item.rating === 'liked' ? '👍 Liked' : 
                             '👎 Disliked'}
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

                  {/* Overview with expandable description */}
                  {item.tmdbOverview && (
                    <div className="mb-3 sm:mb-4">
                      <p className={`text-gray-600 text-sm sm:text-base ${expandedDescriptions.has(item.id) ? '' : 'line-clamp-2 sm:line-clamp-3'}`}>
                        {item.tmdbOverview}
                      </p>
                      {/* Only show "See more" if description is long enough to be truncated */}
                      {item.tmdbOverview.length > 200 && (
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
                    <div className="mt-3 sm:mt-4 flex justify-end">
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
