'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Wordmark } from '@/components/app/Wordmark';
import ProSheet from '@/components/app/ProSheet';
import { tmdbPosterUrl } from '@/lib/poster';
import { formatPickMeta } from '@/lib/display-labels';
import { trackUmamiEvent } from '@/lib/umami-bootstrap';
import {
  DEFAULT_TONIGHT_CONTEXT,
  TONIGHT_ENERGY_OPTIONS,
  TONIGHT_TIME_OPTIONS,
  TONIGHT_WHO_OPTIONS,
  formatTonightContextLine,
  parseTonightContext,
  tonightContextEquals,
  type TonightContext,
} from '@/lib/tonight-context';
import type { TonightCandidate } from '@/lib/tonight-cache';

const CONTEXT_STORAGE_KEY = 'watchme:tonight-context';

type TonightResponse =
  | {
      empty: true;
      listCount: number;
      isPro: boolean;
      watching: WatchingRow[];
      claudeCalled: boolean;
    }
  | {
      empty: false;
      isPro: boolean;
      context: TonightContext;
      pick: TonightCandidate;
      watching: WatchingRow[];
      claudeCalled: boolean;
      fromCache: boolean;
    };

type WatchingRow = {
  id: string;
  title: string;
  type: string;
  tmdbPosterPath: string | null;
  year: number | null;
};

function loadStoredContext(): TonightContext {
  if (typeof window === 'undefined') return DEFAULT_TONIGHT_CONTEXT;
  try {
    return parseTonightContext(JSON.parse(localStorage.getItem(CONTEXT_STORAGE_KEY) || '')) ?? DEFAULT_TONIGHT_CONTEXT;
  } catch {
    return DEFAULT_TONIGHT_CONTEXT;
  }
}

function ChipRow<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const selected = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                selected
                  ? 'bg-accent text-accent-ink border-accent'
                  : 'border-line text-muted bg-surface'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function TonightHome() {
  const [context, setContext] = useState<TonightContext>(DEFAULT_TONIGHT_CONTEXT);
  const [data, setData] = useState<TonightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const viewedRef = useRef(false);

  const applyPayload = useCallback((payload: TonightResponse) => {
    setData(payload);
    if (!payload.empty && payload.isPro) {
      setContext(payload.context);
    }
  }, []);

  const fetchPick = useCallback(
    async (opts?: { context?: TonightContext; refresh?: boolean }) => {
      const ctx = opts?.context ?? context;
      const params = new URLSearchParams({
        time: ctx.time,
        who: ctx.who,
        energy: ctx.energy,
      });
      if (opts?.refresh) params.set('refresh', 'true');
      const res = await fetch(`/api/tonight?${params.toString()}`, { credentials: 'include' });
      const json = (await res.json()) as TonightResponse;
      applyPayload(json);
      return json;
    },
    [applyPayload, context]
  );

  useEffect(() => {
    const stored = loadStoredContext();
    setContext(stored);
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          time: stored.time,
          who: stored.who,
          energy: stored.energy,
        });
        const res = await fetch(`/api/tonight?${params.toString()}`, { credentials: 'include' });
        const json = (await res.json()) as TonightResponse;
        if (!cancelled) applyPayload(json);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyPayload]);

  useEffect(() => {
    if (!data || data.empty || viewedRef.current) return;
    viewedRef.current = true;
    trackUmamiEvent('pick_viewed');
  }, [data]);

  const changeContext = async (next: TonightContext) => {
    setContext(next);
    try {
      localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    if (!data || data.empty || !data.isPro) return;
    if (tonightContextEquals(next, data.context)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/tonight', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pick_again', context: next }),
      });
      const json = (await res.json()) as TonightResponse;
      applyPayload(json);
      trackUmamiEvent('pick_regenerated');
    } finally {
      setBusy(false);
    }
  };

  const notTonight = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/tonight', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'not_tonight' }),
      });
      const json = (await res.json()) as TonightResponse;
      applyPayload(json);
      trackUmamiEvent('not_tonight');
    } finally {
      setBusy(false);
    }
  };

  const pickAgain = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/tonight', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pick_again', context }),
      });
      const json = (await res.json()) as TonightResponse;
      applyPayload(json);
      trackUmamiEvent('pick_regenerated');
    } finally {
      setBusy(false);
    }
  };

  const startWatching = async (itemId: string) => {
    setBusy(true);
    try {
      await fetch('/api/watchlist', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, status: 'watching' }),
      });
      trackUmamiEvent('start_watching');
      await fetchPick();
    } finally {
      setBusy(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="px-4 pt-6 pb-28 max-w-lg mx-auto">
        <Wordmark size="sm" />
        <p className="mt-10 text-muted text-center">Finding tonight&apos;s pick…</p>
      </div>
    );
  }

  if (data.empty) {
    return (
      <div className="px-4 pt-6 pb-28 max-w-lg mx-auto">
        <Wordmark size="sm" />
        <div className="mt-8 rounded-2xl bg-surface border border-line p-6">
          <p className="text-lg text-ink">Add a few more and I&apos;ll have something to say.</p>
          <Link
            href="/add"
            className="mt-5 inline-flex rounded-xl bg-accent text-accent-ink font-semibold px-4 py-2.5"
          >
            Add
          </Link>
        </div>
      </div>
    );
  }

  const pick = data.pick;
  const poster = tmdbPosterUrl(pick.tmdbPosterPath, 'w500');
  const isPro = data.isPro;

  return (
    <div className="px-4 pt-6 pb-28 max-w-lg mx-auto">
      <Wordmark size="sm" />

      {isPro ? (
        <div className="mt-5 space-y-2">
          <ChipRow
            legend="Time available"
            options={TONIGHT_TIME_OPTIONS}
            value={context.time}
            onChange={(time) => void changeContext({ ...context, time })}
          />
          <ChipRow
            legend="Who's watching"
            options={TONIGHT_WHO_OPTIONS}
            value={context.who}
            onChange={(who) => void changeContext({ ...context, who })}
          />
          <ChipRow
            legend="Energy"
            options={TONIGHT_ENERGY_OPTIONS}
            value={context.energy}
            onChange={(energy) => void changeContext({ ...context, energy })}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setProOpen(true);
            trackUmamiEvent('pro_lock_viewed');
          }}
          className="mt-5 w-full text-left rounded-full border border-line bg-surface px-3 py-2 text-xs text-muted"
        >
          {formatTonightContextLine(DEFAULT_TONIGHT_CONTEXT)}
          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-accent">Pro</span>
        </button>
      )}

      <article className="mt-5 rounded-2xl bg-surface border border-line overflow-hidden">
        {poster ? (
          <div className="relative w-full aspect-[2/3] max-h-[52vh] bg-elevated">
            <Image
              src={poster}
              alt={pick.title}
              fill
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
              priority
            />
          </div>
        ) : null}
        <div className="p-5 space-y-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{pick.title}</h1>
            <p className="text-sm text-muted mt-1">
              {formatPickMeta({
                year: pick.year,
                type: pick.type,
                runtimeMinutes: pick.runtimeMinutes,
              })}
            </p>
          </div>
          <p className="text-[15px] leading-relaxed text-ink/90">{pick.reason}</p>
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => void startWatching(pick.id)}
              className="w-full rounded-xl bg-accent text-accent-ink font-semibold py-3 disabled:opacity-50"
            >
              Start watching
            </button>
            {isPro ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void notTonight()}
                  className="rounded-xl border border-line py-2.5 text-sm text-ink"
                >
                  Not tonight
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void pickAgain()}
                  className="rounded-xl border border-line py-2.5 text-sm text-ink"
                >
                  Pick again
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      {data.watching.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted mb-3">Watching now</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {data.watching.map((row) => {
              const src = tmdbPosterUrl(row.tmdbPosterPath, 'w185');
              return (
                <Link
                  key={row.id}
                  href="/watchlist"
                  className="shrink-0 w-20"
                >
                  <div className="relative w-20 aspect-[2/3] rounded-lg overflow-hidden bg-elevated">
                    {src ? (
                      <Image src={src} alt={row.title} fill className="object-cover" sizes="80px" />
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {proOpen ? <ProSheet onClose={() => setProOpen(false)} /> : null}
    </div>
  );
}
