'use client';

import { useState, useEffect, useRef } from 'react';
import { WatchItem } from '@/types/watchlist';
// We'll hold off on FormInput, FormSelect, Image imports for now to keep it simpler

console.log('WatchlistForm SCRIPT EXECUTING (Phase 1 Restore)');

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
  console.log('WatchlistForm FUNCTION BODY ENTERED (Phase 1 Restore)');

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

  // Log some state to see if it initializes (optional, can be removed later)
  console.log('WatchlistForm (Phase 1 Restore) - Initial form state:', form);
  console.log('WatchlistForm (Phase 1 Restore) - Initial TMDB query:', tmdbSearchQuery);


  // Minimal JSX from previous test
  return (
    <div>
      <h1 style={{ color: 'orange', fontSize: '20px', padding: '15px', border: '2px solid orange', textAlign: 'center' }}>
        WATCHLIST FORM - PHASE 1 RESTORE (State & Types)
      </h1>
      <p style={{ textAlign: 'center', margin: '10px' }}>
        Check console for SCRIPT EXECUTING, FUNCTION BODY, and initial state logs.
      </p>
      <div style={{ padding: '10px', margin: '10px auto', border: '1px dashed #ccc', maxWidth: '300px' }}>
        <p>Title (from state): {form.title || '(empty)'}</p>
        <p>Type (from state): {form.type}</p>
        <p>TMDB Query (state): {tmdbSearchQuery || '(empty)'}</p>
      </div>
      <button
        onClick={() => {
          console.log('Phase 1 Test Button Clicked');
          setForm(prev => ({...prev, title: 'Test Title Clicked'}));
          setTmdbSearchQuery('Test Query Clicked');
        }}
        style={{ display: 'block', margin: '10px auto', padding: '10px', backgroundColor: 'green', color: 'white' }}
      >
        Phase 1 Test Interactions Button
      </button>
    </div>
  );
}
