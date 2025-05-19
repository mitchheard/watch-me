'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { WatchlistFormData, TMDBSearchResult, TMDBItemDetails, MediaType, WatchStatus, WatchItem } from '@/types/watchlist';
import Image from 'next/image';
import { useDebounceValue } from 'usehooks-ts';

console.log('WatchlistForm SCRIPT EXECUTING (Phase 6 Restore - RHF Integration)');

type WatchlistFormInputs = WatchlistFormData;

const initialFormState: WatchlistFormInputs = {
  title: '',
  type: 'movie',
  status: 'plan_to_watch',
  currentEpisode: null,
  totalEpisodes: null,
  season: null,
  tmdbId: null,
  tmdbPosterPath: null
};

interface WatchlistFormProps {
  itemToEdit?: WatchItem;
  onAddItem: (item: WatchlistFormData) => Promise<void>;
  onUpdateItem?: (id: string, item: WatchlistFormData) => Promise<void>;
  onCancelEdit?: () => void;
}

export default function WatchlistForm({
  itemToEdit,
  onAddItem,
  onUpdateItem,
  onCancelEdit
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
      currentEpisode: itemToEdit.currentEpisode,
      totalEpisodes: itemToEdit.totalEpisodes,
      season: itemToEdit.season,
      tmdbId: itemToEdit.tmdbId,
      tmdbPosterPath: itemToEdit.tmdbPosterPath
    } : initialFormState
  });

  const watchedTitle = watch('title');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounceValue(tmdbSearchQuery, 500);
  const [tmdbResults, setTmdbResults] = useState<TMDBSearchResult[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [selectedTmdbItemDetails, setSelectedTmdbItemDetails] = useState<TMDBItemDetails | null>(null);
  const [fetchingTmdbDetails, setFetchingTmdbDetails] = useState(false);
  const searchResultsRef = useRef<HTMLUListElement>(null);
  const [tmdbSearchError, setTmdbSearchError] = useState<string | null>(null);
  const [tmdbDetailError, setTmdbDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      reset({
        title: itemToEdit.title,
        type: itemToEdit.type,
        status: itemToEdit.status,
        currentEpisode: itemToEdit.currentEpisode,
        totalEpisodes: itemToEdit.totalEpisodes,
        season: itemToEdit.season,
        tmdbId: itemToEdit.tmdbId,
        tmdbPosterPath: itemToEdit.tmdbPosterPath
      });

      // If item has TMDB data, fetch fresh details
      if (itemToEdit.tmdbId) {
        handleTmdbItemSelect({
          id: Number(itemToEdit.tmdbId),
          media_type: itemToEdit.type === 'movie' ? 'movie' : 'tv',
          poster_path: itemToEdit.tmdbPosterPath || null
        } as TMDBSearchResult);
      }
    } else {
      reset(initialFormState);
      setSelectedTmdbItemDetails(null);
    }
    setTmdbSearchQuery('');
    setError(null);
    setSuccessMessage(null);
    setTmdbResults([]);
    setShowTmdbResults(false);
    setTmdbSearchError(null);
    setTmdbDetailError(null);
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
        setTmdbResults(data);
        setShowTmdbResults(true);
      } catch (error) {
        console.error('Error searching TMDB:', error);
        setTmdbSearchError('Failed to search for titles. Please try again.');
      } finally {
        setTmdbLoading(false);
      }
    };

    searchTmdb();
  }, [debouncedSearchQuery]);

  const handleTmdbItemSelect = async (item: TMDBSearchResult): Promise<void> => {
    setShowTmdbResults(false);
    setFetchingTmdbDetails(true);
    try {
      const response = await fetch(`/api/tmdb/details?id=${item.id}&mediaType=${item.media_type}`);
      const details: TMDBItemDetails = await response.json();
      setSelectedTmdbItemDetails(details);
      
      // Update form values
      setValue('title', details.title || details.name || '');
      setValue('type', details.media_type === 'tv' ? 'show' : 'movie');
      setValue('tmdbId', details.id.toString());
      setValue('tmdbPosterPath', details.poster_path || undefined);
      
      if (details.media_type === 'tv' && details.number_of_episodes) {
        setValue('totalEpisodes', details.number_of_episodes);
      }
    } catch (error) {
      console.error('Error fetching TMDB details:', error);
      setTmdbDetailError('Failed to fetch title details. Please try again.');
    } finally {
      setFetchingTmdbDetails(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue('title', newValue);
    setTmdbSearchQuery(newValue);
    
    if (!newValue) {
      setSelectedTmdbItemDetails(null);
      setValue('tmdbId', undefined);
      setValue('tmdbPosterPath', undefined);
    }
  };

  const onSubmit = async (data: WatchlistFormData) => {
    setError(null);
    setSuccessMessage(null);

    try {
      if (itemToEdit) {
        await onUpdateItem?.(itemToEdit.id, data);
        setSuccessMessage('Item updated successfully!');
      } else {
        await onAddItem(data);
        setSuccessMessage('Item added successfully!');
        reset();
        setSelectedTmdbItemDetails(null);
        setTmdbSearchQuery('');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the item');
    }
  };
  
  console.log('(Phase 6) Render. Watched Title (RHF):', watchedTitle, 'isSubmitting:', isSubmitting);
  const watchedFormValues = watch();

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
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
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
                    {result.poster_path && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                        alt=""
                        width={45}
                        height={68}
                        className="mr-3 rounded"
                        unoptimized
                      />
                    )}
                    <div>
                      <div className="font-medium">{result.title || result.name}</div>
                      <div className="text-sm text-gray-500">
                        {result.release_date || result.first_air_date
                          ? new Date(
                              result.release_date || result.first_air_date || ''
                            ).getFullYear()
                          : 'Release date unknown'}
                        {' • '}
                        {result.media_type === 'tv' ? 'TV Show' : 'Movie'}
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

          {!tmdbLoading && !tmdbSearchError && watchedTitle && watchedTitle.length >= 3 && !showTmdbResults && !selectedTmdbItemDetails && !itemToEdit && (
            <div className="mt-2 text-sm text-gray-600">
              We couldn&apos;t find this title in our database, but you can still add it to your list. We&apos;ll work on matching it with our database later.
            </div>
          )}
        </div>

        {/* Type Select */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            id="type"
            {...register('type')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            disabled={!!selectedTmdbItemDetails}
          >
            <option value="movie">Movie</option>
            <option value="show">TV Show</option>
          </select>
        </div>

        {/* Status Select */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            {...register('status')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
          >
            <option value="plan_to_watch">Plan to Watch</option>
            <option value="watching">Currently Watching</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>

        {/* Season Fields for TV Shows */}
        {watch('type') === 'show' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1">
                Current Season
              </label>
              <input
                type="number"
                id="season"
                {...register('season', {
                  min: { value: 1, message: 'Season must be at least 1' },
                  valueAsNumber: true,
                })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
              {errors.season && (
                <p className="mt-1 text-sm text-red-600">{errors.season.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="currentEpisode" className="block text-sm font-medium text-gray-700 mb-1">
                Current Episode
              </label>
              <input
                type="number"
                id="currentEpisode"
                {...register('currentEpisode', {
                  min: { value: 1, message: 'Episode must be at least 1' },
                  valueAsNumber: true,
                })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
              {errors.currentEpisode && (
                <p className="mt-1 text-sm text-red-600">{errors.currentEpisode.message}</p>
              )}
            </div>

            {selectedTmdbItemDetails?.number_of_episodes && (
              <div>
                <p className="text-sm text-gray-500">
                  Total Episodes: {selectedTmdbItemDetails.number_of_episodes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error and Success Messages */}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {successMessage && (
          <div className="text-sm text-green-600">{successMessage}</div>
        )}

        {/* Submit Button */}
        <div className="mt-6 flex justify-end gap-3">
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : itemToEdit ? 'Update' : 'Add to List'}
          </button>
        </div>
      </form>
    </div>
  );
}
