'use client';

import { useState, useEffect, useRef } from 'react';
import { WatchItem } from '@/types/watchlist';
import Image from 'next/image'; // Restore for TMDB posters
// We'll hold off on FormInput, FormSelect, Image imports for now to keep it simpler

console.log('WatchlistForm SCRIPT EXECUTING (Phase 4 Restore - Live TMDB Search)');

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

export default function WatchlistForm({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAddItem,
  itemToEdit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdateItem,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCancelEdit
}: {
  onAddItem: (newItem: WatchItem) => void;
  itemToEdit?: WatchItem;
  onUpdateItem?: (item: WatchItem) => void;
  onCancelEdit?: () => void;
}) {
  console.log('WatchlistForm FUNCTION BODY ENTERED (Phase 4 Restore - Live TMDB Search)');

  const initialFormState: WatchlistFormState = {
    title: '',
    type: 'movie',
    status: 'want-to-watch',
    currentSeason: null,
    totalSeasons: null,
    notes: null,
    rating: null,
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [form, setForm] = useState<WatchlistFormState>(initialFormState);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // TMDB Search State
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [selectedTmdbItemDetails, setSelectedTmdbItemDetails] = useState<TmdbItemDetails | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fetchingTmdbDetails, setFetchingTmdbDetails] = useState(false);
  const searchResultsRef = useRef<HTMLUListElement>(null);
  const [tmdbSearchError, setTmdbSearchError] = useState<string | null>(null); // Specific error for TMDB search

  // Reintroduce the main useEffect for itemToEdit
  useEffect(() => {
    console.log('WatchlistForm (Phase 4) - itemToEdit useEffect triggered. itemToEdit:', itemToEdit);
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
      console.log('(Phase 4) itemToEdit effect - existingTmdbDetails:', existingTmdbDetails);
      setTmdbSearchQuery(itemToEdit.title || '');
    } else {
      setSelectedTmdbItemDetails(null); // Clear for new items
      setTmdbSearchQuery('');
    }
    setSuccessMessage(null);
    setError(null);
    setTmdbResults([]);
    setShowTmdbResults(false);
    console.log('(Phase 4) itemToEdit effect - finished setting states');
  }, [itemToEdit]);

  // TMDB search useEffect - now calls live handler
  useEffect(() => {
    const queryToSearch = tmdbSearchQuery;
    console.log('(Phase 4) TMDB Search useEffect. Query:', queryToSearch, 'Selected:', !!selectedTmdbItemDetails, 'Editing:', !!itemToEdit);
    if (queryToSearch && queryToSearch.length > 1 && !selectedTmdbItemDetails && !itemToEdit) {
      console.log('(Phase 4) TMDB Search useEffect: Conditions MET. Calling handleTmdbSearch with:', queryToSearch);
      handleTmdbSearch(queryToSearch);
    } else {
      console.log('(Phase 4) TMDB Search useEffect: Conditions NOT MET. Clearing results.');
      setTmdbResults([]); setShowTmdbResults(false);
    }
  }, [tmdbSearchQuery, selectedTmdbItemDetails, itemToEdit]);

  // Live handleTmdbSearch function
  const handleTmdbSearch = async (query: string) => {
    console.log('(Phase 4) handleTmdbSearch LIVE called with query:', query);
    if (!query) {
      setTmdbResults([]); setShowTmdbResults(false); setTmdbSearchError(null);
      return;
    }
    setTmdbLoading(true); setTmdbSearchError(null);
    try {
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || 'Failed to search TMDB');
      }
      const data = await response.json();
      console.log('(Phase 4) Live TMDB Search API response:', data);
      setTmdbResults(data.results?.filter((r: TmdbSearchResult) => (r.media_type === 'movie' || r.media_type === 'tv') && (r.title || r.name)) || []);
      setShowTmdbResults(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('(Phase 4) TMDB Search Error:', err);
      setTmdbSearchError(err.message || 'Could not fetch TMDB results.');
      setTmdbResults([]); setShowTmdbResults(false);
    }
    setTmdbLoading(false);
  };

  const handleSelectTmdbItem_LOG_ONLY = (item: TmdbSearchResult) => {
    console.log('(Phase 4) TMDB Item Selected (LOG ONLY):', item);
    // Next phase will wire this to fetch details and set form
    setShowTmdbResults(false); // Hide results after selection for now
  };
  
  console.log('(Phase 4) Render. Query:', tmdbSearchQuery, 'Loading:', tmdbLoading, 'Results:', tmdbResults.length, 'Show:', showTmdbResults);

  return (
    <div className="relative">
      <h1 style={{ color: '#FF6347', fontSize: '20px', padding: '15px', border: '2px solid #FF6347', textAlign: 'center' }}>
        WATCHLIST FORM - PHASE 4 (Live TMDB Search)
      </h1>
      <div style={{ padding: '10px', margin: '10px auto', border: '1px dashed #ccc', maxWidth: '400px' }}>
        <p>TMDB Query (state): {tmdbSearchQuery || '(empty)'}</p>
        <input 
          type="text" value={tmdbSearchQuery} 
          onChange={(e) => {
            setTmdbSearchQuery(e.target.value);
            if (!itemToEdit) { setSelectedTmdbItemDetails(null); }
          }} 
          placeholder="Type movie/show title for TMDB search"
          style={{width: '90%', padding: '5px', margin: '5px auto', display:'block'}}
        />
        {tmdbLoading && <p style={{textAlign: 'center', margin: '5px'}}>Loading TMDB results...</p>}
        {tmdbSearchError && <p style={{textAlign: 'center', margin: '5px', color: 'red'}}>Error: {tmdbSearchError}</p>}
        {showTmdbResults && tmdbResults.length > 0 && (
          <ul ref={searchResultsRef} style={{listStyle: 'none', padding: '0', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px', maxHeight: '300px', overflowY: 'auto', backgroundColor: 'white', position: 'absolute', width: 'calc(90% - 10px)', left: '5%', zIndex: '10'}}>
            {tmdbResults.map((item) => (
              <li key={item.id} onClick={() => handleSelectTmdbItem_LOG_ONLY(item)} style={{padding: '8px 12px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', alignItems: 'center'}} className="hover:bg-slate-100">
                {item.poster_path && (
                  <Image src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title || item.name || 'poster'} width={40} height={60} style={{borderRadius: '3px', marginRight: '10px'}} />
                )}
                <div>
                  <span style={{fontWeight: 'bold'}}>{item.title || item.name}</span>
                  <span style={{fontSize: '0.8em', color: '#555', marginLeft: '5px'}}>
                    ({item.media_type === 'movie' ? (item.release_date?.split('-')[0] || 'N/A') : (item.first_air_date?.split('-')[0] || 'N/A')})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {showTmdbResults && tmdbResults.length === 0 && !tmdbLoading && <p style={{textAlign: 'center', margin: '5px'}}>No results found for &quot;{tmdbSearchQuery}&quot;.</p>}
      </div>
    </div>
  );
}
