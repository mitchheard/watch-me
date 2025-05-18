'use client';

import { useState, useEffect, useRef } from 'react';
import { WatchItem } from '@/types/watchlist';
// We'll hold off on FormInput, FormSelect, Image imports for now to keep it simpler

console.log('WatchlistForm SCRIPT EXECUTING (Phase 2 Restore - useEffect)');

// Define types for TMDB search results (can be expanded)
interface TmdbSearchResult {
  id: number;
  title?: string; // For movies
  name?: string; // For TV shows
  poster_path?: string | null;
  release_date?: string; // Movie release date
  first_air_date?: string; // TV first air date
  media_type?: 'movie' | 'tv';
}

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

type WatchlistFormState = Omit<WatchItem,
  'id' | 'createdAt' | 'updatedAt' | 'userId' |
  keyof TmdbItemDetails 
> & {
  notes: string | null;
  rating: number | null;
};

export default function WatchlistForm({ onAddItem, itemToEdit, onUpdateItem, onCancelEdit }: {
  onAddItem: (newItem: WatchItem) => void;
  itemToEdit?: WatchItem;
  onUpdateItem?: (item: WatchItem) => void;
  onCancelEdit?: () => void;
}) {
  console.log('WatchlistForm FUNCTION BODY ENTERED (Phase 2 Restore - useEffect)');

  const initialFormState: WatchlistFormState = {
    title: '',
    type: 'movie',
    status: 'want-to-watch',
    currentSeason: null,
    totalSeasons: null,
    notes: null,
    rating: null,
  };
  const [form, setForm] = useState<WatchlistFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // TMDB Search State
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [selectedTmdbItemDetails, setSelectedTmdbItemDetails] = useState<TmdbItemDetails | null>(null);
  const [fetchingTmdbDetails, setFetchingTmdbDetails] = useState(false);
  const searchResultsRef = useRef<HTMLUListElement>(null);

  // Reintroduce the main useEffect for itemToEdit
  useEffect(() => {
    console.log('WatchlistForm (Phase 2) - itemToEdit useEffect triggered. itemToEdit:', itemToEdit);
    // Original logic from this useEffect
    if (!itemToEdit && titleInputRef.current) {
      // titleInputRef.current.focus(); // Still keep focus commented out
    }
    setForm(prevForm => ({
      ...prevForm,
      title: itemToEdit?.title || '',
      type: itemToEdit?.type || 'movie',
      status: itemToEdit?.status || 'want-to-watch',
      currentSeason: itemToEdit?.currentSeason || null,
      totalSeasons: itemToEdit?.totalSeasons || null,
      notes: itemToEdit?.notes || null,
      rating: itemToEdit?.rating || null,
    }));

    if (itemToEdit) {
      const existingTmdbDetails: TmdbItemDetails = {};
      if (itemToEdit.tmdbId !== undefined) existingTmdbDetails.tmdbId = itemToEdit.tmdbId;
      if (itemToEdit.tmdbPosterPath !== undefined) existingTmdbDetails.tmdbPosterPath = itemToEdit.tmdbPosterPath;
      // ... (conditionally add other tmdb fields from itemToEdit to existingTmdbDetails if they exist)
      // For brevity, only adding a few here for the test, can expand later if this part works
      if (itemToEdit.tmdbOverview !== undefined) existingTmdbDetails.tmdbOverview = itemToEdit.tmdbOverview;

      setSelectedTmdbItemDetails(Object.keys(existingTmdbDetails).length > 0 ? existingTmdbDetails : null);
      console.log('(Phase 2) itemToEdit effect - existingTmdbDetails:', existingTmdbDetails);
      setTmdbSearchQuery(itemToEdit.title || '');
    } else {
      setSelectedTmdbItemDetails(null); // Clear for new items
      setTmdbSearchQuery('');
    }
    setSuccessMessage(null);
    setError(null);
    setTmdbResults([]);
    setShowTmdbResults(false);
    console.log('(Phase 2) itemToEdit effect - finished setting states');
  }, [itemToEdit]);

  console.log('WatchlistForm (Phase 2) - Render state. Form:', form, 'TMDB Query:', tmdbSearchQuery, 'Selected TMDB:', selectedTmdbItemDetails);

  return (
    <div>
      <h1 style={{ color: 'purple', fontSize: '20px', padding: '15px', border: '2px solid purple', textAlign: 'center' }}>
        WATCHLIST FORM - PHASE 2 RESTORE (useEffect)
      </h1>
      <p style={{ textAlign: 'center', margin: '10px' }}>
        Check console for SCRIPT, FUNCTION BODY, useEffect, and render state logs.
      </p>
      <div style={{ padding: '10px', margin: '10px auto', border: '1px dashed #ccc', maxWidth: '400px' }}>
        <p>Form Title (state): {form.title || '(empty)'}</p>
        <p>Form Type (state): {form.type}</p>
        <p>TMDB Query (state): {tmdbSearchQuery || '(empty)'}</p>
        <p>Selected TMDB ID (state): {selectedTmdbItemDetails?.tmdbId || '(none)'}</p>
        <p>Selected TMDB Overview (state): {selectedTmdbItemDetails?.tmdbOverview || '(none)'}</p>
      </div>
      {/* No button needed for this phase, we test by how itemToEdit (prop) affects state via useEffect */}
    </div>
  );
}
