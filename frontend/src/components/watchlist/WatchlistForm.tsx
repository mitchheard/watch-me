'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { WatchItem } from '@/types/watchlist';
import Image from 'next/image';
import { useDebounceValue } from 'usehooks-ts';

console.log('WatchlistForm SCRIPT EXECUTING (Phase 6 Restore - RHF Integration)');

interface TmdbSearchResult { id: number; title?: string; name?: string; poster_path?: string | null; release_date?: string; first_air_date?: string; media_type: 'movie' | 'tv'; /* media_type is required for details call */ }
// Expanded TmdbItemDetails based on expected API response from /api/tmdb/details
interface TmdbItemDetails {
  tmdbId?: number | null;
  tmdbPosterPath?: string | null;
  tmdbOverview?: string | null;
  tmdbTagline?: string | null;
  tmdbImdbId?: string | null;
  tmdbMovieRuntime?: number | null;
  tmdbMovieReleaseYear?: number | null;
  tmdbMovieCertification?: string | null;
  tmdbTvFirstAirYear?: number | null;
  tmdbTvLastAirYear?: number | null;
  tmdbTvNetworks?: string | null; // Assuming this will be a comma-separated string
  tmdbTvNumberOfEpisodes?: number | null;
  tmdbTvNumberOfSeasons?: number | null;
  tmdbTvStatus?: string | null;
  tmdbTvCertification?: string | null;
  // Raw fields that might come from details endpoint, to be mapped
  runtime?: number; // movie
  release_date?: string; // movie
  first_air_date?: string; // tv
  last_air_date?: string; // tv
  networks?: { name: string }[]; // tv
  number_of_episodes?: number; //tv
  number_of_seasons?: number; //tv
  status?: string; //tv general status
  certification?: string; // Can come from release_dates for movies or content_ratings for TV
}

// This type will be used by react-hook-form
// It includes all fields from WatchItem (excluding Prisma/DB specific ones) AND TmdbItemDetails
type WatchlistFormInputs = Omit<WatchItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & TmdbItemDetails;

const initialFormState: WatchlistFormInputs = {
  title: '',
  type: 'movie',
  status: 'want-to-watch',
  currentSeason: null,
  totalSeasons: null,
  // Initialize TMDB detail fields
  tmdbId: null, tmdbPosterPath: null, tmdbOverview: null, tmdbTagline: null, tmdbImdbId: null,
  tmdbMovieRuntime: null, tmdbMovieReleaseYear: null, tmdbMovieCertification: null,
  tmdbTvFirstAirYear: null, tmdbTvLastAirYear: null, tmdbTvNetworks: null,
  tmdbTvNumberOfEpisodes: null, tmdbTvNumberOfSeasons: null, tmdbTvStatus: null, tmdbTvCertification: null,
};

export default function WatchlistForm({
  onAddItem,
  itemToEdit,
  onUpdateItem,
  onCancelEdit
}: {
  onAddItem: (newItem: WatchItem) => void;
  itemToEdit?: WatchItem;
  onUpdateItem?: (item: WatchItem) => void;
  onCancelEdit?: () => void;
}) {
  console.log('WatchlistForm FUNCTION BODY ENTERED (Phase 6 Restore - RHF Integration)');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WatchlistFormInputs>({
    defaultValues: initialFormState,
  });

  const watchedTitle = watch('title');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [debouncedTmdbSearchQuery] = useDebounceValue(tmdbSearchQuery, 500);
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [selectedTmdbItemDetails, setSelectedTmdbItemDetails] = useState<TmdbItemDetails | null>(null);
  const [fetchingTmdbDetails, setFetchingTmdbDetails] = useState(false);
  const searchResultsRef = useRef<HTMLUListElement>(null);
  const [tmdbSearchError, setTmdbSearchError] = useState<string | null>(null);
  const [tmdbDetailError, setTmdbDetailError] = useState<string | null>(null);

  useEffect(() => {
    console.log('(Phase 6) itemToEdit useEffect. itemToEdit:', itemToEdit);
    if (itemToEdit) {
      const formValues: WatchlistFormInputs = {
        title: itemToEdit.title || '',
        type: itemToEdit.type || 'movie',
        status: itemToEdit.status || 'want-to-watch',
        currentSeason: itemToEdit.currentSeason || null,
        totalSeasons: itemToEdit.totalSeasons || null,
        tmdbId: itemToEdit.tmdbId || null,
        tmdbPosterPath: itemToEdit.tmdbPosterPath || null,
        tmdbOverview: itemToEdit.tmdbOverview || null,
        tmdbTagline: itemToEdit.tmdbTagline || null,
        tmdbImdbId: itemToEdit.tmdbImdbId || null,
        tmdbMovieRuntime: itemToEdit.tmdbMovieRuntime || null,
        tmdbMovieReleaseYear: itemToEdit.tmdbMovieReleaseYear || null,
        tmdbMovieCertification: itemToEdit.tmdbMovieCertification || null,
        tmdbTvFirstAirYear: itemToEdit.tmdbTvFirstAirYear || null,
        tmdbTvLastAirYear: itemToEdit.tmdbTvLastAirYear || null,
        tmdbTvNetworks: itemToEdit.tmdbTvNetworks || null,
        tmdbTvNumberOfEpisodes: itemToEdit.tmdbTvNumberOfEpisodes || null,
        tmdbTvNumberOfSeasons: itemToEdit.tmdbTvNumberOfSeasons || null,
        tmdbTvStatus: itemToEdit.tmdbTvStatus || null,
        tmdbTvCertification: itemToEdit.tmdbTvCertification || null,
      };
      reset(formValues);

      // If item has TMDB data, set it as selected
      if (itemToEdit.tmdbId) {
        setSelectedTmdbItemDetails({
          tmdbId: itemToEdit.tmdbId,
          tmdbPosterPath: itemToEdit.tmdbPosterPath,
          tmdbOverview: itemToEdit.tmdbOverview,
          tmdbTagline: itemToEdit.tmdbTagline,
          tmdbImdbId: itemToEdit.tmdbImdbId,
          tmdbMovieRuntime: itemToEdit.tmdbMovieRuntime,
          tmdbMovieReleaseYear: itemToEdit.tmdbMovieReleaseYear,
          tmdbMovieCertification: itemToEdit.tmdbMovieCertification,
          tmdbTvFirstAirYear: itemToEdit.tmdbTvFirstAirYear,
          tmdbTvLastAirYear: itemToEdit.tmdbTvLastAirYear,
          tmdbTvNetworks: itemToEdit.tmdbTvNetworks,
          tmdbTvNumberOfEpisodes: itemToEdit.tmdbTvNumberOfEpisodes,
          tmdbTvNumberOfSeasons: itemToEdit.tmdbTvNumberOfSeasons,
          tmdbTvStatus: itemToEdit.tmdbTvStatus,
          tmdbTvCertification: itemToEdit.tmdbTvCertification,
        });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemToEdit, reset]);

  useEffect(() => {
    const queryToSearch = debouncedTmdbSearchQuery;
    console.log('(Phase 6) TMDB Search (debounced) useEffect. Query:', queryToSearch, 'Selected:', !!selectedTmdbItemDetails);
    
    if (queryToSearch && queryToSearch.length > 1 && !selectedTmdbItemDetails) {
      console.log('(Phase 6) TMDB Search useEffect: Conditions MET. Calling handleTmdbSearch with:', queryToSearch);
      handleTmdbSearch(queryToSearch);
    } else {
      console.log('(Phase 6) TMDB Search useEffect: Conditions NOT MET. Clearing results.');
      setTmdbResults([]);
      setShowTmdbResults(false);
    }
  }, [debouncedTmdbSearchQuery, selectedTmdbItemDetails]);

  const handleTmdbSearch = async (query: string) => {
    console.log('(Phase 6) handleTmdbSearch LIVE called with query:', query);
    if (!query) {
      setTmdbResults([]);
      setShowTmdbResults(false);
      setTmdbSearchError(null);
      return;
    }
    setTmdbLoading(true);
    setTmdbSearchError(null);
    try {
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || 'Failed to search TMDB');
      }
      const data = await response.json();
      console.log('(Phase 6) Live TMDB Search API response:', data);
      setTmdbResults(data.results?.filter((r: TmdbSearchResult) => (r.media_type === 'movie' || r.media_type === 'tv') && (r.title || r.name)) || []);
      setShowTmdbResults(true);
    } catch (err: any) {
      console.error('(Phase 6) TMDB Search Error:', err);
      setTmdbSearchError(err.message || 'Could not fetch TMDB results.');
      setTmdbResults([]);
      setShowTmdbResults(false);
    }
    setTmdbLoading(false);
  };

  const handleTmdbSelect = async (item: TmdbSearchResult) => {
    console.log('(Phase 6) TMDB Item Selected:', item);
    setValue('title', item.title || item.name || '');
    setValue('type', item.media_type === 'tv' ? 'show' : 'movie');
    setValue('tmdbId', item.id);
    if (item.poster_path) {
        setValue('tmdbPosterPath', item.poster_path);
    }

    setSelectedTmdbItemDetails({ tmdbId: item.id, tmdbPosterPath: item.poster_path });
    setTmdbResults([]);
    setShowTmdbResults(false); 
    setTmdbSearchQuery(item.title || item.name || '');

    setFetchingTmdbDetails(true);
    setTmdbDetailError(null);
    try {
      const response = await fetch(`/api/tmdb/details?id=${item.id}&type=${item.media_type}`);
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.details || 'Failed to fetch TMDB details'); }
      const detailedData: TmdbItemDetails = await response.json();
      console.log('(Phase 6) Fetched TMDB Full Details:', detailedData);

      setSelectedTmdbItemDetails(prev => ({ ...(prev || {}), ...detailedData, tmdbId: item.id }));

      setValue('tmdbPosterPath', detailedData.tmdbPosterPath || item.poster_path);
      setValue('tmdbOverview', detailedData.tmdbOverview || null);
      setValue('tmdbTagline', detailedData.tmdbTagline || null);
      setValue('tmdbImdbId', detailedData.tmdbImdbId || null);
      
      setValue('tmdbMovieRuntime', detailedData.runtime || detailedData.tmdbMovieRuntime || null);
      setValue('tmdbMovieReleaseYear', detailedData.tmdbMovieReleaseYear || (detailedData.release_date ? parseInt(detailedData.release_date.split('-')[0]) : null));
      setValue('tmdbMovieCertification', (detailedData as any).certification || detailedData.tmdbMovieCertification || null);
      
      setValue('tmdbTvFirstAirYear', detailedData.tmdbTvFirstAirYear || (detailedData.first_air_date ? parseInt(detailedData.first_air_date.split('-')[0]) : null));
      setValue('tmdbTvLastAirYear', detailedData.tmdbTvLastAirYear || (detailedData.last_air_date ? parseInt(detailedData.last_air_date.split('-')[0]) : null));
      setValue('tmdbTvNetworks', detailedData.networks?.map(n => n.name).join(', ') || detailedData.tmdbTvNetworks || null);
      setValue('tmdbTvNumberOfEpisodes', detailedData.number_of_episodes || detailedData.tmdbTvNumberOfEpisodes || null);
      setValue('tmdbTvNumberOfSeasons', detailedData.number_of_seasons || detailedData.tmdbTvNumberOfSeasons || null);
      setValue('tmdbTvStatus', detailedData.status || detailedData.tmdbTvStatus || null);
    } catch (err: any) {
      console.error('(Phase 6) Error fetching TMDB details:', err);
      setTmdbDetailError(err.message || 'Could not fetch TMDB details.');
    }
    setFetchingTmdbDetails(false);
  };

  const onSubmit: SubmitHandler<WatchlistFormInputs> = async (data: WatchlistFormInputs) => {
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        title: data.title,
        type: data.type,
        status: data.status,
        currentSeason: data.type === 'show' ? data.currentSeason : null,
        totalSeasons: data.type === 'show' ? data.tmdbTvNumberOfSeasons : null,
        // TMDB fields
        tmdbId: data.tmdbId,
        tmdbPosterPath: data.tmdbPosterPath,
        tmdbOverview: data.tmdbOverview,
        tmdbTagline: data.tmdbTagline,
        tmdbImdbId: data.tmdbImdbId,
        tmdbMovieRuntime: data.tmdbMovieRuntime,
        tmdbMovieReleaseYear: data.tmdbMovieReleaseYear,
        tmdbMovieCertification: data.tmdbMovieCertification,
        tmdbTvFirstAirYear: data.tmdbTvFirstAirYear,
        tmdbTvLastAirYear: data.tmdbTvLastAirYear,
        tmdbTvNetworks: data.tmdbTvNetworks,
        tmdbTvNumberOfEpisodes: data.tmdbTvNumberOfEpisodes,
        tmdbTvNumberOfSeasons: data.tmdbTvNumberOfSeasons,
        tmdbTvStatus: data.tmdbTvStatus,
        tmdbTvCertification: data.tmdbTvCertification,
      };

      if (itemToEdit) {
        const response = await fetch(`/api/watchlist/${itemToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update item');
        }

        const updatedItem = await response.json();
        onUpdateItem?.(updatedItem);
        setSuccessMessage('Item updated successfully!');
      } else {
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add item');
        }

        const newItem = await response.json();
        onAddItem(newItem);
        setSuccessMessage('Item added successfully!');
        reset(initialFormState);
        setSelectedTmdbItemDetails(null);
        setTmdbSearchQuery('');
      }
    } catch (err: any) {
      console.error('Form submission error:', err);
      setError(err.message || 'An error occurred while saving the item');
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
            onChange={(e) => {
              const newValue = e.target.value;
              setValue('title', newValue);
              setTmdbSearchQuery(newValue);
              
              // Reset TMDB data when title is cleared
              if (!newValue) {
                setSelectedTmdbItemDetails(null);
                setValue('tmdbId', null);
                setValue('tmdbPosterPath', null);
                setValue('tmdbOverview', null);
                setValue('tmdbTagline', null);
                setValue('tmdbImdbId', null);
                setValue('tmdbMovieRuntime', null);
                setValue('tmdbMovieReleaseYear', null);
                setValue('tmdbMovieCertification', null);
                setValue('tmdbTvFirstAirYear', null);
                setValue('tmdbTvLastAirYear', null);
                setValue('tmdbTvNetworks', null);
                setValue('tmdbTvNumberOfEpisodes', null);
                setValue('tmdbTvNumberOfSeasons', null);
                setValue('tmdbTvStatus', null);
                setValue('tmdbTvCertification', null);
              }
            }}
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
                  onClick={() => handleTmdbSelect(result)}
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
              We couldn't find this title in our database, but you can still add it to your list. We'll work on matching it with our database later.
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
            <option value="want-to-watch">Want to Watch</option>
            <option value="watching">Currently Watching</option>
            <option value="finished">Finished</option>
          </select>
        </div>

        {/* Season Fields for TV Shows */}
        {watch('type') === 'show' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="currentSeason" className="block text-sm font-medium text-gray-700 mb-1">
                What season are you on?
              </label>
              <input
                type="number"
                id="currentSeason"
                {...register('currentSeason', {
                  min: { value: 1, message: 'Season must be at least 1' },
                  valueAsNumber: true,
                })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
              {errors.currentSeason && (
                <p className="mt-1 text-sm text-red-600">{errors.currentSeason.message}</p>
              )}
            </div>

            {selectedTmdbItemDetails?.tmdbTvNumberOfSeasons && (
              <div>
                <p className="text-sm text-gray-500">
                  Total Seasons: {selectedTmdbItemDetails.tmdbTvNumberOfSeasons}
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
