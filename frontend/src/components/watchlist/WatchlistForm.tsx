'use client';

import { useState, useEffect, useRef } from 'react';
import { WatchItem } from '@/types/watchlist';
import Image from 'next/image';
import { useDebounceValue } from 'usehooks-ts'; // Changed from useDebounce

console.log('WatchlistForm SCRIPT EXECUTING (Phase 5 Restore - TMDB Select & Details)');

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

type WatchlistFormState = Omit<WatchItem, 'id' | 'createdAt' | 'updatedAt' | 'userId' | keyof TmdbItemDetails>
  & TmdbItemDetails // Include all TmdbItemDetails fields directly in form state
  & { title: string; type: 'movie' | 'show'; status: 'want-to-watch' | 'watching' | 'finished'; notes: string | null; rating: number | null; currentSeason: number | null; totalSeasons: number | null; };

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
  console.log('WatchlistForm FUNCTION BODY ENTERED (Phase 5 Restore - TMDB Select & Details)');

  const initialFormState: WatchlistFormState = {
    title: '',
    type: 'movie',
    status: 'want-to-watch',
    currentSeason: null, totalSeasons: null, notes: null, rating: null,
    // Initialize TMDB detail fields
    tmdbId: null, tmdbPosterPath: null, tmdbOverview: null, tmdbTagline: null, tmdbImdbId: null,
    tmdbMovieRuntime: null, tmdbMovieReleaseYear: null, tmdbMovieCertification: null,
    tmdbTvFirstAirYear: null, tmdbTvLastAirYear: null, tmdbTvNetworks: null,
    tmdbTvNumberOfEpisodes: null, tmdbTvNumberOfSeasons: null, tmdbTvStatus: null, tmdbTvCertification: null,
  };
  const [form, setForm] = useState<WatchlistFormState>(initialFormState);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
    console.log('(Phase 5) itemToEdit useEffect. itemToEdit:', itemToEdit);
    if (itemToEdit) {
      setForm({
        title: itemToEdit.title || '',
        type: itemToEdit.type || 'movie',
        status: itemToEdit.status || 'want-to-watch',
        currentSeason: itemToEdit.currentSeason || null,
        totalSeasons: itemToEdit.totalSeasons || null,
        notes: itemToEdit.notes || null,
        rating: itemToEdit.rating || null,
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
      });
      // If itemToEdit has tmdbId, consider it as selected for TMDB purposes
      if (itemToEdit.tmdbId) {
        setSelectedTmdbItemDetails({ tmdbId: itemToEdit.tmdbId, tmdbPosterPath: itemToEdit.tmdbPosterPath, tmdbOverview: itemToEdit.tmdbOverview });
      }
      setTmdbSearchQuery(itemToEdit.title || '');
    } else {
      setForm(initialFormState); // Reset form for new items
      setSelectedTmdbItemDetails(null);
      setTmdbSearchQuery('');
    }
    setSuccessMessage(null); setError(null); setTmdbResults([]); setShowTmdbResults(false);
    setTmdbSearchError(null); setTmdbDetailError(null);
  }, [itemToEdit]);

  // TMDB search useEffect - uses debounced query
  useEffect(() => {
    const queryToSearch = debouncedTmdbSearchQuery;
    console.log('(Phase 5) TMDB Search (debounced) useEffect. Query:', queryToSearch, 'Selected:', !!selectedTmdbItemDetails, 'Editing:', !!itemToEdit);
    if (queryToSearch && queryToSearch.length > 1 && !selectedTmdbItemDetails && (!itemToEdit || (itemToEdit && !itemToEdit.tmdbId))) {
        // Allow search if new item, OR if editing an item that does NOT yet have a tmdbId
      console.log('(Phase 5) TMDB Search useEffect: Conditions MET. Calling handleTmdbSearch with:', queryToSearch);
      handleTmdbSearch(queryToSearch);
    } else {
      console.log('(Phase 5) TMDB Search useEffect: Conditions NOT MET (too short, item selected, or editing item with existing TMDB ID). Clearing results.');
      setTmdbResults([]); setShowTmdbResults(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTmdbSearchQuery, selectedTmdbItemDetails, itemToEdit?.tmdbId]); // itemToEdit?.tmdbId helps re-evaluate if tmdbId is cleared during edit

  const handleTmdbSearch = async (query: string) => {
    console.log('(Phase 5) handleTmdbSearch LIVE called with query:', query);
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
      console.log('(Phase 5) Live TMDB Search API response:', data);
      setTmdbResults(data.results?.filter((r: TmdbSearchResult) => (r.media_type === 'movie' || r.media_type === 'tv') && (r.title || r.name)) || []);
      setShowTmdbResults(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('(Phase 5) TMDB Search Error:', err);
      setTmdbSearchError(err.message || 'Could not fetch TMDB results.');
      setTmdbResults([]); setShowTmdbResults(false);
    }
    setTmdbLoading(false);
  };

  const handleTmdbSelect = async (item: TmdbSearchResult) => {
    console.log('(Phase 5) TMDB Item Selected:', item);
    setForm(prev => ({ ...prev, title: item.title || item.name || '', type: item.media_type === 'tv' ? 'show' : 'movie' }));
    setSelectedTmdbItemDetails({ tmdbId: item.id, tmdbPosterPath: item.poster_path }); // Basic details first
    setTmdbResults([]); setShowTmdbResults(false); setTmdbSearchQuery(item.title || item.name || '');

    setFetchingTmdbDetails(true); setTmdbDetailError(null);
    try {
      const response = await fetch(`/api/tmdb/details?id=${item.id}&type=${item.media_type}`);
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.details || 'Failed to fetch TMDB details'); }
      const detailedData: TmdbItemDetails = await response.json();
      console.log('(Phase 5) Fetched TMDB Full Details:', detailedData);

      setSelectedTmdbItemDetails(prev => ({ ...(prev || {}), ...detailedData, tmdbId: item.id })); // Merge, ensuring tmdbId from selection is kept

      // Update form state with detailed data
      setForm(prev => ({
        ...prev,
        tmdbId: item.id,
        tmdbPosterPath: detailedData.tmdbPosterPath || item.poster_path, // Use detailed if available, else from search
        tmdbOverview: detailedData.tmdbOverview || null,
        tmdbTagline: detailedData.tmdbTagline || null,
        tmdbImdbId: detailedData.tmdbImdbId || null,
        tmdbMovieRuntime: detailedData.runtime || null, 
        tmdbMovieReleaseYear: detailedData.tmdbMovieReleaseYear || (detailedData.release_date ? parseInt(detailedData.release_date.split('-')[0]) : null),
        tmdbMovieCertification: detailedData.certification || null, // This needs careful mapping from API
        tmdbTvFirstAirYear: detailedData.tmdbTvFirstAirYear || (detailedData.first_air_date ? parseInt(detailedData.first_air_date.split('-')[0]) : null),
        tmdbTvLastAirYear: detailedData.tmdbTvLastAirYear || (detailedData.last_air_date ? parseInt(detailedData.last_air_date.split('-')[0]) : null),
        tmdbTvNetworks: detailedData.networks?.map(n => n.name).join(', ') || null,
        tmdbTvNumberOfEpisodes: detailedData.number_of_episodes || null,
        tmdbTvNumberOfSeasons: detailedData.number_of_seasons || null,
        tmdbTvStatus: detailedData.status || null, // TV series status
        // tmdbTvCertification: ??? // Needs mapping from content_ratings if available for TV
      }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('(Phase 5) Error fetching TMDB details:', err);
      setTmdbDetailError(err.message || 'Could not fetch TMDB details.');
    }
    setFetchingTmdbDetails(false);
  };
  
  console.log('(Phase 5) Render. Form Title:', form.title, 'Query:', tmdbSearchQuery, 'Loading Search:', tmdbLoading, 'Fetching Details:', fetchingTmdbDetails);

  return (
    <div className="relative">
      <h1 style={{ color: '#20B2AA', fontSize: '20px', padding: '15px', border: '2px solid #20B2AA', textAlign: 'center' }}>
        WATCHLIST FORM - PHASE 5 (TMDB Select & Details)
      </h1>
      <div style={{ padding: '10px', margin: '10px auto', border: '1px dashed #ccc', maxWidth: '400px' }}>
        <p>TMDB Search Query (type here): {tmdbSearchQuery || '(empty)'}</p>
        <input 
          type="text" value={tmdbSearchQuery} 
          onChange={(e) => {
            setTmdbSearchQuery(e.target.value);
            // If user types, it implies they are changing selection, so clear selected TMDB details
            // But only if not in edit mode or if in edit mode for an item that didn't have TMDB data
            if (!itemToEdit || (itemToEdit && !itemToEdit.tmdbId)) {
                setSelectedTmdbItemDetails(null); 
                // Reset related form fields if user starts typing a new search query
                setForm(prev => ({...prev, tmdbId: null, tmdbPosterPath: null, tmdbOverview: null /* etc. */}));
            }
          }} 
          placeholder="Type movie/show title for TMDB search"
          style={{width: '90%', padding: '5px', margin: '5px auto', display:'block'}}
          disabled={fetchingTmdbDetails || (!!selectedTmdbItemDetails && !!itemToEdit?.tmdbId) } // Disable if fetching or if editing an item that already has full TMDB data
        />
        {tmdbLoading && <p style={{textAlign: 'center', margin: '5px'}}>Loading TMDB search results...</p>}
        {tmdbSearchError && <p style={{textAlign: 'center', margin: '5px', color: 'red'}}>Search Error: {tmdbSearchError}</p>}
        {showTmdbResults && tmdbResults.length > 0 && (
          <ul ref={searchResultsRef} style={{listStyle: 'none', padding: '0', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px', maxHeight: '200px', overflowY: 'auto', backgroundColor: 'white', position: 'absolute', width: 'calc(90% - 10px)', left: '5%', zIndex: '10'}}>
            {tmdbResults.map((item) => (
              <li key={item.id} onClick={() => handleTmdbSelect(item)} style={{padding: '8px 12px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', alignItems: 'center'}} className="hover:bg-slate-100">
                {item.poster_path && <Image src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title || item.name || 'poster'} width={40} height={60} style={{borderRadius: '3px', marginRight: '10px'}} />} 
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <span style={{fontWeight: 'bold'}}>{item.title || item.name}</span>
                  <span style={{fontSize: '0.8em', color: '#555'}}>
                    ({item.media_type === 'movie' ? (item.release_date?.split('-')[0] || 'N/A') : (item.first_air_date?.split('-')[0] || 'N/A')})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {showTmdbResults && tmdbResults.length === 0 && !tmdbLoading && <p>No results found for &quot;{debouncedTmdbSearchQuery}&quot;.</p>}
        
        {fetchingTmdbDetails && <p style={{textAlign: 'center', margin: '10px', color: 'blue'}}>Fetching full TMDB details...</p>}
        {tmdbDetailError && <p style={{textAlign: 'center', margin: '10px', color: 'red'}}>TMDB Detail Error: {tmdbDetailError}</p>}

        <div style={{marginTop: '15px', padding: '10px', borderTop: '1px solid #eee'}}>
            <h3 style={{fontWeight:'bold'}}>Form State Preview:</h3>
            <p>Title: {form.title || '(empty)'}</p>
            <p>Type: {form.type || '(empty)'}</p>
            <p>TMDB ID: {form.tmdbId || '(none)'}</p>
            <p>Poster Path: {form.tmdbPosterPath || '(none)'}</p>
            <p>Overview: {form.tmdbOverview ? form.tmdbOverview.substring(0,100)+'...' : '(none)'}</p>
            <p>Movie Year: {form.tmdbMovieReleaseYear || '(N/A)'}</p>
            <p>TV Networks: {form.tmdbTvNetworks || '(N/A)'}</p>
        </div>

      </div>
    </div>
  );
}
