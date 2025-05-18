'use client';

import { useState, useEffect, useRef } from 'react';
import FormInput from '../forms/FormInput';
import FormSelect from '../forms/FormSelect';
import { WatchItem } from '@/types/watchlist';
import useDebounce from '@/hooks/useDebounce';
import Image from 'next/image';

// Define types for TMDB search results (can be expanded)
interface TmdbSearchResult {
  id: number;
  title?: string; // For movies
  name?: string; // For TV shows
  poster_path?: string | null;
  release_date?: string; // Movie release date
  first_air_date?: string; // TV first air date
  media_type?: 'movie' | 'tv'; // TMDB multi-search often returns this
  // Add other fields you might want to display in search results
}

// Define a more specific type for the form state if WatchItem includes id/createdAt
// WatchlistFormState will represent the fields the form directly manages.
// User's notes and rating are part of this form.
// TMDB fields are handled via selectedTmdbItemDetails and merged on submit.
type WatchlistFormState = Omit<WatchItem, 
  'id' | 'createdAt' | 'updatedAt' | 'userId' | // Fields not directly set by form
  keyof TmdbItemDetails // Exclude TMDB fields as they are handled separately
> & { 
  notes: string | null; // Ensure notes and rating are part of the form state
  rating: number | null;
  // currentSeason and totalSeasons are already in WatchItem and not TMDB specific
};

// Type for the detailed TMDB data we plan to store
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
  tmdbTvNetworks?: string | null;
  tmdbTvNumberOfEpisodes?: number | null;
  tmdbTvNumberOfSeasons?: number | null;
  tmdbTvStatus?: string | null;
  tmdbTvCertification?: string | null;
}

export default function WatchlistForm({ onAddItem, itemToEdit, onUpdateItem, onCancelEdit }: { 
  onAddItem: (newItem: WatchItem) => void,
  itemToEdit?: WatchItem, 
  onUpdateItem?: (item: WatchItem) => void, 
  onCancelEdit?: () => void 
}) {
  const initialFormState: WatchlistFormState = {
    title: '',
    type: 'movie',
    status: 'want-to-watch',
    currentSeason: null,
    totalSeasons: null,
    notes: null, // Initialize notes
    rating: null,  // Initialize rating
  };
  const [form, setForm] = useState<WatchlistFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // TMDB Search State
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const debouncedTmdbSearchQuery = useDebounce(tmdbSearchQuery, 500);
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [selectedTmdbItemDetails, setSelectedTmdbItemDetails] = useState<TmdbItemDetails | null>(null);
  const [fetchingTmdbDetails, setFetchingTmdbDetails] = useState(false); // New state for detail fetching
  const searchResultsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!itemToEdit && titleInputRef.current) {
      titleInputRef.current.focus();
    }
    setForm(prevForm => ({
      ...prevForm,
      title: itemToEdit?.title || '',
      type: itemToEdit?.type || 'movie',
      status: itemToEdit?.status || 'want-to-watch',
      currentSeason: itemToEdit?.currentSeason || null,
      totalSeasons: itemToEdit?.totalSeasons || null,
      notes: itemToEdit?.notes || null, // Populate notes from itemToEdit
      rating: itemToEdit?.rating || null, // Populate rating from itemToEdit
    }));

    if (itemToEdit) {
      const existingTmdbDetails: TmdbItemDetails = {};
      if (itemToEdit.tmdbId !== undefined) existingTmdbDetails.tmdbId = itemToEdit.tmdbId;
      if (itemToEdit.tmdbPosterPath !== undefined) existingTmdbDetails.tmdbPosterPath = itemToEdit.tmdbPosterPath;
      if (itemToEdit.tmdbOverview !== undefined) existingTmdbDetails.tmdbOverview = itemToEdit.tmdbOverview;
      if (itemToEdit.tmdbTagline !== undefined) existingTmdbDetails.tmdbTagline = itemToEdit.tmdbTagline;
      if (itemToEdit.tmdbImdbId !== undefined) existingTmdbDetails.tmdbImdbId = itemToEdit.tmdbImdbId;
      if (itemToEdit.tmdbMovieRuntime !== undefined) existingTmdbDetails.tmdbMovieRuntime = itemToEdit.tmdbMovieRuntime;
      if (itemToEdit.tmdbMovieReleaseYear !== undefined) existingTmdbDetails.tmdbMovieReleaseYear = itemToEdit.tmdbMovieReleaseYear;
      if (itemToEdit.tmdbMovieCertification !== undefined) existingTmdbDetails.tmdbMovieCertification = itemToEdit.tmdbMovieCertification;
      if (itemToEdit.tmdbTvFirstAirYear !== undefined) existingTmdbDetails.tmdbTvFirstAirYear = itemToEdit.tmdbTvFirstAirYear;
      if (itemToEdit.tmdbTvLastAirYear !== undefined) existingTmdbDetails.tmdbTvLastAirYear = itemToEdit.tmdbTvLastAirYear;
      if (itemToEdit.tmdbTvNetworks !== undefined) existingTmdbDetails.tmdbTvNetworks = itemToEdit.tmdbTvNetworks;
      if (itemToEdit.tmdbTvNumberOfEpisodes !== undefined) existingTmdbDetails.tmdbTvNumberOfEpisodes = itemToEdit.tmdbTvNumberOfEpisodes;
      if (itemToEdit.tmdbTvNumberOfSeasons !== undefined) existingTmdbDetails.tmdbTvNumberOfSeasons = itemToEdit.tmdbTvNumberOfSeasons;
      if (itemToEdit.tmdbTvStatus !== undefined) existingTmdbDetails.tmdbTvStatus = itemToEdit.tmdbTvStatus;
      if (itemToEdit.tmdbTvCertification !== undefined) existingTmdbDetails.tmdbTvCertification = itemToEdit.tmdbTvCertification;
      
      setSelectedTmdbItemDetails(Object.keys(existingTmdbDetails).length > 0 ? existingTmdbDetails : null);
      setTmdbSearchQuery(itemToEdit.title || '');
    } else {
      setSelectedTmdbItemDetails(null); // Clear for new items
      setTmdbSearchQuery('');
    }
    setSuccessMessage(null);
    setError(null);
    setTmdbResults([]);
    setShowTmdbResults(false);
  }, [itemToEdit]);

  // Effect for debounced TMDB search
  useEffect(() => {
    console.log('TMDB Search Effect on Render:', { // Added 'on Render' for clarity if logs get mixed
      rawQuery: tmdbSearchQuery, 
      debouncedQuery: debouncedTmdbSearchQuery, 
      selectedTmdbItemDetailsExists: !!selectedTmdbItemDetails, 
      isEditing: !!itemToEdit 
    });
    if (debouncedTmdbSearchQuery && debouncedTmdbSearchQuery.length > 2 && !selectedTmdbItemDetails && !itemToEdit) {
      console.log('Calling handleTmdbSearch with (on Render):', debouncedTmdbSearchQuery);
      handleTmdbSearch(debouncedTmdbSearchQuery);
    } else {
      // console.log('Not calling handleTmdbSearch, clearing results.'); // Optional log
      setTmdbResults([]);
      setShowTmdbResults(false);
    }
  }, [debouncedTmdbSearchQuery, selectedTmdbItemDetails, itemToEdit]);

  const handleTmdbSearch = async (query: string) => {
    if (!query) {
      setTmdbResults([]);
      setShowTmdbResults(false);
      return;
    }
    setTmdbLoading(true);
    setError(null);
    try {
      // We will use a multi search to get both movies and TV shows
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`); 
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || 'Failed to search TMDB');
      }
      const data = await response.json();
      console.log('Raw TMDB Search API response:', data);
      // Filter out persons if multi-search returns them, and ensure we have a title/name
      setTmdbResults(data.results?.filter((r: any) => (r.media_type === 'movie' || r.media_type === 'tv') && (r.title || r.name)) || []);
      setShowTmdbResults(true);
    } catch (err: any) {
      console.error('TMDB Search Error:', err);
      setError(err.message || 'Could not fetch TMDB results.');
      setTmdbResults([]);
      setShowTmdbResults(false);
    }
    setTmdbLoading(false);
  };

  const handleTmdbSelect = async (item: TmdbSearchResult) => {
    console.log('TMDB item selected from dropdown:', item);
    if (!item.media_type || !item.id) {
      setError('Selected TMDB item is missing type or ID.');
      return;
    }
    setFetchingTmdbDetails(true);
    setShowTmdbResults(false); // Hide search results
    setTmdbResults([]); // Clear search results
    setError(null);
    try {
      const response = await fetch(`/api/tmdb/details?type=${item.media_type}&tmdbId=${item.id}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || `Failed to fetch details for ${item.title || item.name}`);
      }
      const fetchedDetails: TmdbItemDetails = await response.json();
      console.log('Fetched TMDB Item Details for selection:', fetchedDetails);
      setSelectedTmdbItemDetails(fetchedDetails);

      // Auto-fill form fields
      setForm(prevForm => {
        let newType: 'movie' | 'show' = prevForm.type; // Start with previous type or a default
        if (item.media_type === 'movie') {
          newType = 'movie';
        } else if (item.media_type === 'tv') {
          newType = 'show'; // Map TMDB 'tv' to internal 'show'
        }
        console.log('Setting form type to:', newType, 'from item.media_type:', item.media_type);
        return {
          ...prevForm,
          title: item.title || item.name || prevForm.title, // Use TMDB title/name
          type: newType, 
          // Optionally pre-fill totalSeasons if it's a TV show and data is available
          totalSeasons: item.media_type === 'tv' && fetchedDetails.tmdbTvNumberOfSeasons 
                        ? fetchedDetails.tmdbTvNumberOfSeasons 
                        : prevForm.totalSeasons,
          // Reset currentSeason if type changes or totalSeasons gets populated from TMDB for a show
          currentSeason: item.media_type === 'tv' && fetchedDetails.tmdbTvNumberOfSeasons 
                         ? null // Encourage user to set current season if they start tracking a new show
                         : prevForm.currentSeason,
        };
      });
      // Set the main title input value directly to reflect the selected TMDB item
      // This also stops further debounced searches for this title.
      setTmdbSearchQuery(item.title || item.name || ''); 

    } catch (err: any) {
      console.error('Error fetching TMDB details:', err);
      setError(err.message || 'Could not fetch TMDB item details.');
      setSelectedTmdbItemDetails(null); // Clear if fetching details failed
    }
    setFetchingTmdbDetails(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: name === 'currentSeason' || name === 'totalSeasons' 
              ? (value === '' ? null : Number(value)) 
              : value,
    }));

    if (name === 'title') {
      setTmdbSearchQuery(value); // Update search query based on title input
      setSelectedTmdbItemDetails(null); // Clear selected TMDB item if title changes
      setShowTmdbResults(value.length > 0); // Show results dropdown if title is not empty
    }
  };
  
  // Click outside listener for TMDB results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowTmdbResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchResultsRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);
    setError(null);

    const currentSeasonNum = form.currentSeason ? Number(form.currentSeason) : null;
    const totalSeasonsNum = form.totalSeasons ? Number(form.totalSeasons) : null;

    if (form.currentSeason !== null && isNaN(currentSeasonNum as number)) {
      setError("Current season must be a valid number.");
      setSubmitting(false);
      return;
    }
    if (form.totalSeasons !== null && isNaN(totalSeasonsNum as number)) {
      setError("Total seasons must be a valid number.");
      setSubmitting(false);
      return;
    }

    // Define a type for the data being sent to the API
    // This avoids issues with sending client-only or server-generated fields like createdAt
    type WatchlistSubmitPayload = Partial<Omit<WatchItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'>> & {
      // Include all fields from WatchlistFormState effectively
      title: string;
      type: 'movie' | 'show';
      status: 'want-to-watch' | 'watching' | 'finished';
      currentSeason?: number | null;
      totalSeasons?: number | null;
      notes?: string | null;
      rating?: number | null;
      // And all TMDB fields are optional here because they come from selectedTmdbItemDetails
    } & Partial<TmdbItemDetails>;

    const submitData: WatchlistSubmitPayload = {
      ...form, // Contains title, type, status, currentSeason, totalSeasons, notes, rating
      currentSeason: form.type === 'show' ? currentSeasonNum : null,
      totalSeasons: form.type === 'show' ? totalSeasonsNum : null,
      ...(selectedTmdbItemDetails || {}), // Spread TMDB details if they exist
    };

    // Remove tmdbId if it's null, as our Prisma schema has it as optional but unique.
    // If we send null, it might conflict if other records have null.
    // Better to not send the field at all if no TMDB item was linked.
    if (submitData.tmdbId === null || submitData.tmdbId === undefined) {
      delete submitData.tmdbId;
    }

    try {
      let response;
      if (itemToEdit) {
        // For PUT, we send the item ID in the query param, and the payload contains fields to update.
        response = await fetch(`/api/watchlist?id=${itemToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
      } else {
        // For POST, the payload is the new item data.
        response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        if (itemToEdit && onUpdateItem) {
          onUpdateItem(result);
          setSuccessMessage('Item updated successfully!');
        } else if (onAddItem) {
          onAddItem(result);
          setSuccessMessage('Item added successfully!');
          setForm(initialFormState);
          setSelectedTmdbItemDetails(null);
          setTmdbSearchQuery(''); 
          setShowTmdbResults(false);
          titleInputRef.current?.focus();
        }
        setTimeout(() => { setSuccessMessage(null); setError(null); }, 4000);
      } else {
        const errorData = await response.json(); // Try to parse as JSON first
        setError(`Error: ${errorData.error || errorData.message || (itemToEdit ? 'Failed to update item' : 'Failed to add item')}`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (_err: any) {
      console.error("Submit error:", _err);
      setError(_err.message || 'An unexpected error occurred.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex flex-col gap-4 w-full"
    >
      {/* Title is now part of the modal content, not inside WatchlistForm itself often */}
      {/* <h2 className="text-xl font-semibold text-slate-700 mb-1 text-center">Add New Item</h2> */}
      
      {successMessage && (
        <div className="p-3 rounded-md text-sm font-medium text-center mb-2 bg-green-50 text-green-700 border border-green-200">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-md text-sm font-medium text-center mb-2 bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="relative">
        <FormInput
          id="title"
          name="title"
          label="Title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g., Dune: Part Two"
          required
          ref={titleInputRef}
          className="text-base"
          autoComplete="off" // Prevent browser autocomplete from interfering with TMDB results
        />
        {(tmdbLoading || fetchingTmdbDetails) && 
          <div className="absolute right-2 top-9 text-xs text-slate-500">
            {tmdbLoading ? 'Searching TMDB...' : 'Fetching details...'}
          </div>
        }
        {showTmdbResults && tmdbResults.length > 0 && (
          <ul 
            ref={searchResultsRef} 
            className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {tmdbResults.map((item) => {
              const title = item.title || item.name;
              const year = item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : '';
              return (
                <li 
                  key={item.id}
                  onClick={() => handleTmdbSelect(item)} // Wire up the click handler
                  className="p-3 hover:bg-slate-100 cursor-pointer flex items-center gap-3"
                >
                  {item.poster_path && (
                    <Image 
                      src={`${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL}${item.poster_path}`}
                      alt={title || 'Poster'}
                      width={40} 
                      height={60} 
                      className="rounded object-cover"
                    />
                  )}
                  {!item.poster_path && <div className="w-10 h-[60px] bg-slate-200 rounded flex items-center justify-center text-xs text-slate-400">No Image</div>}
                  <div>
                    <span className="block text-sm font-medium text-slate-700">{title}</span>
                    {year && <span className="block text-xs text-slate-500">{year}</span>}
                    {item.media_type && <span className="block text-xs text-slate-400 capitalize">{item.media_type}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <FormSelect
        id="type"
        name="type"
        label="Type"
        value={form.type}
        onChange={handleChange}
        options={[
          { value: 'movie', label: 'Movie' },
          { value: 'show', label: 'TV Show' },
        ]}
      />

      <FormSelect
        id="status"
        name="status"
        label="Status"
        value={form.status}
        onChange={handleChange}
        options={[
          { value: 'want-to-watch', label: 'Want to Watch' },
          { value: 'watching', label: 'Watching' },
          { value: 'finished', label: 'Finished' },
        ]}
      />

      {form.type === 'show' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            id="currentSeason"
            type="number"
            name="currentSeason"
            label="Current Season"
            value={form.currentSeason ?? ''}
            onChange={handleChange}
            placeholder="e.g., 1 (optional)"
            min="0"
          />
          <FormInput
            id="totalSeasons"
            type="number"
            name="totalSeasons"
            label="Total Seasons"
            value={form.totalSeasons ?? ''}
            onChange={handleChange}
            placeholder="e.g., 3 (optional)"
            min="0"
          />
        </div>
      )}

      <div className={`flex gap-3 pt-4 ${itemToEdit ? 'justify-end' : 'justify-start'} border-t border-slate-200 mt-6`}>
        {itemToEdit && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
      )}
      <button
        type="submit"
        disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
          {submitting ? (itemToEdit ? 'Saving...': 'Adding...') : (itemToEdit ? 'Update Item' : 'Add to Watchlist')}
      </button>
      </div>
    </form>
  );
}
