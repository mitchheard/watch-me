'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import toast from 'react-hot-toast';
import ProSheet from '@/components/app/ProSheet';
import { tmdbPosterUrl } from '@/lib/poster';
import { trackUmamiEvent } from '@/lib/umami-bootstrap';
import type { TMDBItemDetails, TMDBSearchResult } from '@/types/watchlist';

export default function AddTitleSearch() {
  const [query, setQuery] = useState('');
  const [debounced] = useDebounceValue(query, 400);
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const lastTracked = useRef('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (debounced.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(debounced.trim())}`);
        const data = await res.json();
        const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        if (cancelled) return;
        setResults(
          list.filter((r: TMDBSearchResult) => r.media_type === 'movie' || r.media_type === 'tv')
        );
        if (debounced.trim() && lastTracked.current !== debounced.trim()) {
          lastTracked.current = debounced.trim();
          trackUmamiEvent('search_performed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const addResult = async (item: TMDBSearchResult) => {
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    const detailsRes = await fetch(`/api/tmdb/details?id=${item.id}&type=${type}`);
    const details: TMDBItemDetails = await detailsRes.json();
    const payload = {
      title: item.title || item.name || details.title || details.name || 'Untitled',
      type: details.media_type === 'tv' || item.media_type === 'tv' ? 'show' : 'movie',
      status: 'want-to-watch',
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
      tmdbTvNumberOfSeasons: details.tmdbTvNumberOfSeasons || null,
      tmdbTvStatus: details.tmdbTvStatus || null,
      tmdbPopularity: details.tmdbPopularity ?? null,
      tmdbVoteCount: details.tmdbVoteCount ?? null,
    };
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 403 && body.error === 'limit_reached') {
      setProOpen(true);
      trackUmamiEvent('pro_lock_viewed');
      return;
    }
    if (res.status === 409) {
      toast('Already on your list');
      return;
    }
    if (!res.ok) {
      toast.error('Could not add that title');
      return;
    }
    trackUmamiEvent('item_added_to_watchlist');
    toast.success('Added');
    setQuery('');
  };

  return (
    <div className="px-4 pt-6 pb-28 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-ink">Add</h1>
      <p className="text-sm text-muted mt-1">Search TMDB and tap a title.</p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Movie or show"
        className="mt-5 w-full rounded-xl bg-surface border border-line px-3 py-3 text-ink placeholder:text-muted"
        autoFocus
      />
      {loading ? <p className="mt-4 text-sm text-muted">Searching…</p> : null}
      <ul className="mt-4 space-y-2">
        {results.map((result) => {
          const title = result.title || result.name || 'Untitled';
          const poster = tmdbPosterUrl(result.poster_path, 'w92');
          const year = (result.release_date || result.first_air_date || '').slice(0, 4);
          return (
            <li key={`${result.media_type}-${result.id}`}>
              <button
                type="button"
                onClick={() => void addResult(result)}
                className="w-full flex items-center gap-3 rounded-xl bg-surface border border-line p-2 text-left"
              >
                <div className="relative h-16 w-11 shrink-0 rounded overflow-hidden bg-elevated">
                  {poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={poster} alt={title} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{title}</p>
                  <p className="text-xs text-muted">
                    {result.media_type === 'tv' ? 'TV' : 'Movie'}
                    {year ? ` · ${year}` : ''}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {proOpen ? (
        <ProSheet
          line="You're at 50 titles. Pro removes the limit"
          onClose={() => setProOpen(false)}
        />
      ) : null}
    </div>
  );
}
