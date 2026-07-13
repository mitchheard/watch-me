'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { WatchlistFormData, TMDBSearchResult, TMDBItemDetails, WatchItem } from '@/types/watchlist';
import Image from 'next/image';
import { useDebounceValue } from 'usehooks-ts';
import MobileSelect from '@/components/ui/MobileSelect';
import { trackUmamiEvent } from '@/lib/umami-bootstrap';
import { FREE_WATCHLIST_ITEM_LIMIT } from '@/lib/subscription';

console.log('WatchlistForm SCRIPT EXECUTING (Phase 6 Restore - RHF Integration)');

export const LIMIT_REACHED_MESSAGE = `Free accounts are limited to ${FREE_WATCHLIST_ITEM_LIMIT} watchlist items. Upgrade to Pro for unlimited lists.`;

type WatchlistFormInputs = WatchlistFormData;

const initialFormState: WatchlistFormInputs = {
  title: '',
  type: 'movie',
  status: 'want-to-watch',
  currentSeason: null,
  totalSeasons: null,
  tmdbId: null,
  tmdbPosterPath: null,
  tmdbOverview: null,
  tmdbTagline: null,
  tmdbImdbId: null,
  tmdbMovieCertification: null,
  tmdbMovieReleaseYear: null,
  tmdbMovieRuntime: null,
  tmdbTvCertification: null,
  tmdbTvFirstAirYear: null,
  tmdbTvLastAirYear: null,
  tmdbTvNetworks: null,
  tmdbTvNumberOfEpisodes: null,
  tmdbTvNumberOfSeasons: null,
  tmdbTvStatus: null,
  rating: null,
  tmdbPopularity: null,
  tmdbVoteCount: null,
};

interface WatchlistFormProps {
  itemToEdit?: WatchItem;
  _onAddItem: (item: WatchlistFormData) => Promise<void>;
  onUpdateItem?: (id: number, item: WatchlistFormData) => Promise<void>;
  onCancelEdit?: () => void;
  onAddSuccess?: () => void;
}

const tvKeywords = [
  'season', 'episode', 'series', 'show', 'tv', 's0', 'e0', 'part', 'volume', 'chapter'
];

const guessTypeFromTitle = (title: string) => {
  const lower = title.toLowerCase();
  return tvKeywords.some((kw) => lower.includes(kw)) ? 'show' : 'movie';
};

const normalizeType = (type: string) => {
  if (type.toLowerCase().replace(/\s/g, '') === 'tvshow') return 'show';
  if (type.toLowerCase() === 'show') return 'show';
  return 'movie';
};

export default function WatchlistForm({
  itemToEdit,
  _onAddItem,
  onUpdateItem,
  onCancelEdit,
  onAddSuccess
}: WatchlistFormProps) {
  console.log('WatchlistForm FUNCTION BODY ENTERED (Phase 6 Restore - RHF Integration)');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<WatchlistFormInputs>({
    defaultValues: itemToEdit ? {
      title: itemToEdit.title,
      type: itemToEdit.type,
      status: itemToEdit.status,
      currentSeason: itemToEdit.currentSeason,
      totalSeasons: itemToEdit.totalSeasons,
      tmdbId: itemToEdit.tmdbId,
      tmdbPosterPath: itemToEdit.tmdbPosterPath,
      tmdbOverview: itemToEdit.tmdbOverview,
      tmdbTagline: itemToEdit.tmdbTagline,
      tmdbImdbId: itemToEdit.tmdbImdbId,
      tmdbMovieCertification: itemToEdit.tmdbMovieCertification,
      tmdbMovieReleaseYear: itemToEdit.tmdbMovieReleaseYear,
      tmdbMovieRuntime: itemToEdit.tmdbMovieRuntime,
      tmdbTvCertification: itemToEdit.tmdbTvCertification,
      tmdbTvFirstAirYear: itemToEdit.tmdbTvFirstAirYear,
      tmdbTvLastAirYear: itemToEdit.tmdbTvLastAirYear,
      tmdbTvNetworks: itemToEdit.tmdbTvNetworks,
      tmdbTvNumberOfEpisodes: itemToEdit.tmdbTvNumberOfEpisodes,
      tmdbTvNumberOfSeasons: itemToEdit.tmdbTvNumberOfSeasons,
      tmdbTvStatus: itemToEdit.tmdbTvStatus,
      rating: itemToEdit.rating ?? null,
      tmdbPopularity: itemToEdit.tmdbPopularity ?? null,
      tmdbVoteCount: itemToEdit.tmdbVoteCount ?? null,
    } : initialFormState
  });

  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounceValue(tmdbSearchQuery, 500);
  const [tmdbResults, setTmdbResults] = useState<TMDBSearchResult[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const searchResultsRef = useRef<HTMLUListElement>(null);
  const [tmdbSearchError, setTmdbSearchError] = useState<string | null>(null);
  const [isTotalSeasonsFromTmdb, setIsTotalSeasonsFromTmdb] = useState(false);

  const handleTmdbItemSelect = useCallback(async (item: TMDBSearchResult): Promise<void> => {
    setShowTmdbResults(false);
    try {
      const response = await fetch(`/api/tmdb/details?id=${item.id}&type=${item.media_type}`);
      const details: TMDBItemDetails = await response.json();
      // Gather all new values for reset
      const totalSeasonsFromTmdb = details.tmdbTvNumberOfSeasons || null;
      setIsTotalSeasonsFromTmdb(!!totalSeasonsFromTmdb);
      const newValues = {
        title: item.title || item.name || '',
        type: details.media_type === 'tv' ? 'show' : 'movie',
        status: 'want-to-watch',
        currentSeason: null,
        totalSeasons: totalSeasonsFromTmdb,
        tmdbId: details.tmdbId || details.id,
        tmdbPosterPath: details.tmdbPosterPath || details.poster_path || null,
        tmdbOverview: details.tmdbOverview || null,
        tmdbTagline: details.tmdbTagline || null,
        tmdbImdbId: details.tmdbImdbId || null,
        tmdbMovieCertification: details.tmdbMovieCertification || null,
        tmdbMovieReleaseYear: details.tmdbMovieReleaseYear || null,
        tmdbMovieRuntime: details.tmdbMovieRuntime || null,
        tmdbTvCertification: details.tmdbTvCertification || null,
        tmdbTvFirstAirYear: details.tmdbTvFirstAirYear || null,
        tmdbTvLastAirYear: details.tmdbTvLastAirYear || null,
        tmdbTvNetworks: details.tmdbTvNetworks || null,
        tmdbTvNumberOfEpisodes: details.tmdbTvNumberOfEpisodes || null,
        tmdbTvNumberOfSeasons: totalSeasonsFromTmdb, // Use the same value as totalSeasons
        tmdbTvStatus: details.tmdbTvStatus || null,
        rating: null,
        tmdbPopularity: details.tmdbPopularity ?? null,
        tmdbVoteCount: details.tmdbVoteCount ?? null,
      };
      reset(newValues);
    } catch (error) {
      console.error('Error fetching TMDB details:', error);
      setTmdbSearchError('Failed to fetch title details. Please try again.');
    }
  }, [reset]);

  useEffect(() => {
    if (itemToEdit) {
      reset({
        title: itemToEdit.title,
        type: itemToEdit.type,
        status: itemToEdit.status,
        currentSeason: itemToEdit.currentSeason,
        totalSeasons: itemToEdit.totalSeasons,
        tmdbId: itemToEdit.tmdbId,
        tmdbPosterPath: itemToEdit.tmdbPosterPath,
        tmdbOverview: itemToEdit.tmdbOverview,
        tmdbTagline: itemToEdit.tmdbTagline,
        tmdbImdbId: itemToEdit.tmdbImdbId,
        tmdbMovieCertification: itemToEdit.tmdbMovieCertification,
        tmdbMovieReleaseYear: itemToEdit.tmdbMovieReleaseYear,
        tmdbMovieRuntime: itemToEdit.tmdbMovieRuntime,
        tmdbTvCertification: itemToEdit.tmdbTvCertification,
        tmdbTvFirstAirYear: itemToEdit.tmdbTvFirstAirYear,
        tmdbTvLastAirYear: itemToEdit.tmdbTvLastAirYear,
        tmdbTvNetworks: itemToEdit.tmdbTvNetworks,
        tmdbTvNumberOfEpisodes: itemToEdit.tmdbTvNumberOfEpisodes,
        tmdbTvNumberOfSeasons: itemToEdit.tmdbTvNumberOfSeasons,
        tmdbTvStatus: itemToEdit.tmdbTvStatus,
        rating: itemToEdit.rating ?? null
      });
      setIsTotalSeasonsFromTmdb(!!itemToEdit.tmdbTvNumberOfSeasons);
    } else {
      reset(initialFormState);
      setIsTotalSeasonsFromTmdb(false);
    }
    setTmdbSearchQuery('');
    setError(null);
    setLimitReached(false);
    setTmdbResults([]);
    setShowTmdbResults(false);
    setTmdbSearchError(null);
  }, [itemToEdit, reset]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowTmdbResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchTmdb = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 3) {
        setTmdbResults([]);
        setShowTmdbResults(false);
        return;
      }

      setTmdbLoading(true);
      setTmdbSearchError(null);

      try {
        const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(debouncedSearchQuery)}`);
        const data = await response.json();
        setTmdbResults(data.results || []);
        setShowTmdbResults(true);
        if (response.ok) {
          trackUmamiEvent('search_performed');
        }
      } catch (error) {
        console.error('Error searching TMDB:', error);
        setTmdbSearchError('Failed to search for titles. Please try again.');
      } finally {
        setTmdbLoading(false);
      }
    };

    searchTmdb();
  }, [debouncedSearchQuery]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue('title', newValue);
    setTmdbSearchQuery(newValue);

    if (!newValue) {
      setValue('tmdbId', null);
      setValue('tmdbPosterPath', null);
      setValue('tmdbOverview', null);
      setValue('tmdbTagline', null);
      setValue('tmdbImdbId', null);
      setValue('tmdbMovieCertification', null);
      setValue('tmdbMovieReleaseYear', null);
      setValue('tmdbMovieRuntime', null);
      setValue('tmdbTvCertification', null);
      setValue('tmdbTvFirstAirYear', null);
      setValue('tmdbTvLastAirYear', null);
      setValue('tmdbTvNetworks', null);
      setValue('tmdbTvNumberOfEpisodes', null);
      setValue('tmdbTvNumberOfSeasons', null);
      setValue('tmdbTvStatus', null);
      setValue('tmdbPopularity', null);
      setValue('tmdbVoteCount', null);
    } else {
      // Auto-detect type if user is typing and not selecting TMDB
      const detectedType = guessTypeFromTitle(newValue);
      const normalizedType = normalizeType(detectedType);
      console.log('Auto-detected type:', detectedType, 'Normalized type:', normalizedType);
      setValue('type', normalizedType);
    }
  };

  const onSubmit = async (data: WatchlistFormData) => {
    setError(null);
    setLimitReached(false);

    try {
      if (itemToEdit) {
        // Make PUT request to update the item
        const updatePayload = { ...itemToEdit, ...data, id: itemToEdit.id };
        const putRes = await fetch('/api/watchlist', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
        if (!putRes.ok) {
          setError('An error occurred while saving the item');
          return;
        }
        if (
          updatePayload.status === 'finished' &&
          itemToEdit.status !== 'finished'
        ) {
          trackUmamiEvent('item_marked_watched');
        }
        onUpdateItem?.(itemToEdit.id, updatePayload);
      } else {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.status === 409) {
          const body = await res.json();
          setError(body.error || 'This title is already in your watchlist.');
          return;
        } else if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          if (typeof body.error === 'string' && body.error === 'limit_reached') {
            setLimitReached(true);
          } else {
            setError('An error occurred while saving the item');
          }
          return;
        } else if (!res.ok) {
          setError('An error occurred while saving the item');
          return;
        }
        trackUmamiEvent('item_added_to_watchlist');
        reset();
        setTmdbSearchQuery('');
        if (typeof onAddSuccess === 'function') onAddSuccess();
      }
    } catch (_err) {
      setError('An error occurred while saving the item');
    }
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title Input with TMDB Search */}
        <div className="relative">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            {...register('title', { required: 'Title is required' })}
            onChange={handleTitleChange}
            className="block w-full rounded-md border border-gray-300 px-3 py-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors min-h-[44px]"
            placeholder="Search for a movie or show..."
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}

          {/* TMDB Search Results */}
          {showTmdbResults && tmdbResults.length > 0 && (
            <ul
              ref={searchResultsRef}
              className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
            >
              {tmdbResults.map((result) => (
                <li
                  key={result.id}
                  className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-50"
                  onClick={() => handleTmdbItemSelect(result)}
                >
                  <div className="flex items-center">
                    {result.poster_path ? (
                      <Image 
                        src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                        alt={result.title || result.name || ''}
                        width={45}
                        height={68}
                        className="mr-3 rounded"
                        unoptimized
                      />
                    ) : (
                      <div className="w-[45px] h-[68px] mr-3 bg-slate-200 rounded flex items-center justify-center text-slate-400 text-xs">No Image</div>
                    )}
                    <div>
                      <div className="font-medium">{result.title || result.name}</div>
                      <div className="text-sm text-gray-500">
                        {result.release_date || result.first_air_date
                          ? new Date(result.release_date || result.first_air_date || '').getFullYear()
                          : 'Release date unknown'}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {tmdbLoading && (
            <div className="mt-2 text-sm text-gray-500">Searching...</div>
          )}

          {tmdbSearchError && (
            <div className="mt-2 text-sm text-red-600">{tmdbSearchError}</div>
          )}
        </div>

        {/* Type Selection */}
        <MobileSelect
          label="Type"
          id="type"
          value={watch('type')}
          onChange={(value) => setValue('type', value)}
          options={[
            { value: 'movie', label: 'Movie' },
            { value: 'show', label: 'TV Show' }
          ]}
        />

        {/* Status Selection */}
        <MobileSelect
          label="Status"
          id="status"
          value={watch('status')}
          onChange={(value) => setValue('status', value)}
          options={[
            { value: 'want-to-watch', label: 'Want to Watch' },
            { value: 'watching', label: 'Watching' },
            { value: 'finished', label: 'Finished' }
          ]}
        />

        {/* Show-specific fields */}
        {watch('type') === 'show' && (
          <>
            <div>
              <label htmlFor="currentSeason" className="block text-sm font-medium text-gray-700 mb-1">
                What season are you on?
              </label>
              <input
                type="number"
                id="currentSeason"
                {...register('currentSeason', { valueAsNumber: true })}
                className="block w-full rounded-md border border-gray-300 px-3 py-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors min-h-[44px]"
                placeholder="e.g., 1"
              />
            </div>
            <div>
              <label htmlFor="totalSeasons" className="block text-sm font-medium text-gray-700 mb-1">
                Total Seasons
              </label>
              <input
                type="number"
                id="totalSeasons"
                {...register('totalSeasons', { valueAsNumber: true })}
                className="block w-full rounded-md border border-gray-300 px-3 py-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors min-h-[44px]"
                placeholder="e.g., 3"
                disabled={isTotalSeasonsFromTmdb}
              />
            </div>
          </>
        )}

        {/* Limit upsell (AVIDX-311) — brand blue, not error red */}
        {limitReached && (
          <div
            role="status"
            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
          >
            <p className="text-sm text-blue-900">{LIMIT_REACHED_MESSAGE}</p>
            <Link
              href="/settings"
              className="mt-3 inline-flex w-full justify-center items-center rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[44px]"
            >
              Upgrade to Pro →
            </Link>
          </div>
        )}

        {/* Actual errors only */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Form Actions — hide dead-end Add when at free-tier cap */}
        <div className="flex justify-end gap-3">
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
          )}
          {!limitReached && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex justify-center items-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors min-h-[44px]"
            >
              {isSubmitting ? 'Saving...' : itemToEdit ? 'Update' : 'Add'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
