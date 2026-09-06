'use client';

import { tmdbPosterUrl } from '@/lib/poster';
import { formatAddedDate, formatPickMeta, ratingLabel } from '@/lib/display-labels';
import type { LibraryItem } from '@/components/watchlist/library-types';

const STATUSES = [
  { id: 'want-to-watch', label: 'Want to watch' },
  { id: 'watching', label: 'Watching' },
  { id: 'finished', label: 'Finished' },
] as const;

const RATINGS = [
  { id: 'loved', label: 'Loved' },
  { id: 'liked', label: 'Liked' },
  { id: 'not-for-me', label: "Wasn't for me" },
] as const;

export default function DetailSheet({
  item,
  onClose,
  onChange,
  onRemoved,
}: {
  item: LibraryItem;
  onClose: () => void;
  onChange: (item: LibraryItem) => void;
  onRemoved: () => void;
}) {
  const poster = tmdbPosterUrl(item.tmdbPosterPath, 'w342');
  const year = item.tmdbMovieReleaseYear ?? item.tmdbTvFirstAirYear;
  const added = formatAddedDate(item.createdAt);
  const rating = ratingLabel(item.rating);

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/watchlist', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, ...body }),
    });
    if (!res.ok) return;
    onChange({ ...item, ...body } as LibraryItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="detail-title"
        className="relative w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-t-2xl bg-elevated border border-line p-5 pb-10"
      >
        <div className="flex gap-4">
          <div className="relative w-24 shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-surface">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <h2 id="detail-title" className="text-xl font-semibold text-ink">
              {item.title}
            </h2>
            <p className="text-sm text-muted mt-1">
              {formatPickMeta({
                year,
                type: item.type,
                runtimeMinutes: item.type === 'movie' ? item.tmdbMovieRuntime : null,
              })}
            </p>
            {added ? <p className="text-xs text-muted mt-2">Added {added}</p> : null}
            {rating ? <p className="text-xs text-ink mt-1">{rating}</p> : null}
          </div>
        </div>

        {item.tmdbOverview ? (
          <p className="mt-4 text-sm leading-relaxed text-ink/90">{item.tmdbOverview}</p>
        ) : null}

        <div className="mt-5">
          <p className="text-xs text-muted mb-2">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => void patch({ status: s.id })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  item.status === s.id
                    ? 'bg-accent text-accent-ink border-accent'
                    : 'border-line text-muted'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-muted mb-2">Rate</p>
          <div className="flex flex-wrap gap-1.5">
            {RATINGS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => void patch({ rating: r.id })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  item.rating === r.id
                    ? 'bg-accent text-accent-ink border-accent'
                    : 'border-line text-muted'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <RemoveControl
          onConfirm={async () => {
            const res = await fetch(`/api/watchlist?id=${item.id}`, { method: 'DELETE' });
            if (res.ok) onRemoved();
          }}
        />
      </div>
    </div>
  );
}

function RemoveControl({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-6 text-sm text-danger"
      >
        Remove
      </button>
    );
  }

  return (
    <div className="mt-6 flex items-center gap-3">
      <p className="text-sm text-ink">Remove this title?</p>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onConfirm();
        }}
        className="text-sm font-semibold text-danger"
      >
        Yes, remove
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="text-sm text-muted">
        Cancel
      </button>
    </div>
  );
}

import { useState } from 'react';
