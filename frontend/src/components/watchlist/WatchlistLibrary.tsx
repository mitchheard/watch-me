'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { filterWatchlistItems } from '@/components/watchlist/filterWatchlistItems';
import DetailSheet from '@/components/watchlist/DetailSheet';
import { tmdbPosterUrl } from '@/lib/poster';
import { FREE_WATCHLIST_ITEM_LIMIT } from '@/lib/subscription';
import { FREE_WATCHLIST_NUDGE_AT } from '@/lib/tonight-cache';
import { trackUmamiEvent } from '@/lib/umami-bootstrap';
import type { LibraryItem } from '@/components/watchlist/library-types';

type StatusFilter = 'want-to-watch' | 'watching' | 'finished';
type TypeFilter = 'all' | 'movie' | 'show';

const STATUS_CHIPS: { id: StatusFilter; label: string }[] = [
  { id: 'want-to-watch', label: 'Want to watch' },
  { id: 'watching', label: 'Watching' },
  { id: 'finished', label: 'Finished' },
];

const TYPE_CHIPS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'show', label: 'TV' },
];

export default function WatchlistLibrary() {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('want-to-watch');
  const [type, setType] = useState<TypeFilter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<LibraryItem | null>(null);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const viewedRef = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/watchlist', { credentials: 'include' });
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const r = await fetch('/api/user/subscription', { credentials: 'include' });
      const j = (await r.json()) as { hasProAccess?: boolean; isPro?: boolean };
      if (cancelled) return;
      const entitled = typeof j.hasProAccess === 'boolean' ? j.hasProAccess : j.isPro;
      setIsPro(r.ok && typeof entitled === 'boolean' ? entitled : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!loading && user && !viewedRef.current) {
      viewedRef.current = true;
      trackUmamiEvent('watchlist_viewed');
    }
  }, [loading, user]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const visible = useMemo(
    () => filterWatchlistItems(items, { type, status, searchQuery }),
    [items, type, status, searchQuery]
  );

  const showNudge =
    isPro === false && items.length >= FREE_WATCHLIST_NUDGE_AT && items.length < FREE_WATCHLIST_ITEM_LIMIT;

  if (loading) {
    return <p className="px-4 pt-8 text-center text-muted">Loading your list…</p>;
  }

  return (
    <div className="px-4 pt-6 pb-28 max-w-lg mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Watchlist</h1>
          <p className="text-sm text-muted mt-0.5">
            {items.length} {items.length === 1 ? 'title' : 'titles'}
          </p>
        </div>
        <button
          type="button"
          aria-label={searchOpen ? 'Close search' : 'Search'}
          onClick={() => {
            setSearchOpen((open) => !open);
            if (searchOpen) setSearchQuery('');
          }}
          className="p-2 rounded-full text-ink hover:bg-surface"
        >
          {searchOpen ? <XMarkIcon className="h-6 w-6" /> : <MagnifyingGlassIcon className="h-6 w-6" />}
        </button>
      </div>

      {showNudge ? (
        <p className="mt-3 text-sm text-muted">
          {items.length} of {FREE_WATCHLIST_ITEM_LIMIT} —{' '}
          <Link href="/account" className="text-accent font-medium">
            Pro removes the limit.
          </Link>
        </p>
      ) : null}

      {searchOpen ? (
        <input
          ref={searchRef}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim()) trackUmamiEvent('search_performed');
          }}
          placeholder="Filter by title"
          className="mt-4 w-full rounded-xl bg-surface border border-line px-3 py-2.5 text-ink placeholder:text-muted"
        />
      ) : null}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setStatus(chip.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              status === chip.id ? 'bg-accent text-accent-ink border-accent' : 'border-line text-muted'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TYPE_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setType(chip.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              type === chip.id ? 'bg-accent text-accent-ink border-accent' : 'border-line text-muted'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-ink">Nothing here yet.</p>
          <Link
            href="/add"
            className="mt-4 inline-flex rounded-xl bg-accent text-accent-ink font-semibold px-4 py-2.5"
          >
            Add
          </Link>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-3 gap-2">
          {visible.map((item) => {
            const src = tmdbPosterUrl(item.tmdbPosterPath, 'w185');
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface"
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] text-muted p-2">
                      {item.title}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected ? (
        <DetailSheet
          item={selected}
          onClose={() => setSelected(null)}
          onChange={(next) => {
            setSelected(next);
            setItems((prev) => prev.map((i) => (i.id === next.id ? next : i)));
          }}
          onRemoved={() => {
            setItems((prev) => prev.filter((i) => i.id !== selected.id));
            setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}
