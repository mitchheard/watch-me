import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseRouteUser } from '@/lib/supabase-route-auth';
import { hasProAccess } from '@/lib/subscription';
import { localDateInTimeZone } from '@/lib/user-timezone';
import { resolveRecommendationsTimeContext } from '@/app/api/recommendations/recommendations-helpers';
import {
  DEFAULT_TONIGHT_CONTEXT,
  parseTonightContext,
  tonightContextEquals,
  type TonightContext,
} from '@/lib/tonight-context';
import {
  TONIGHT_MIN_LIST_SIZE,
  buildTonightPickCache,
  isTonightCacheFresh,
  nextTonightShownIndex,
  parseTonightPickCache,
  visibleTonightCandidate,
  type TonightPickCache,
} from '@/lib/tonight-cache';
import { generateTonightCandidates } from '@/lib/tonight-generate';
import type { TonightPromptItem } from '@/lib/tonight-prompt';
import { TMDB } from 'tmdb-ts';

type WatchlistRow = TonightPromptItem & {
  tmdbId: number;
};

async function loadWatchlist(userId: string): Promise<{
  items: WatchlistRow[];
  watching: WatchlistRow[];
  wantToWatch: WatchlistRow[];
  finished: WatchlistRow[];
}> {
  const defaultWatchlist = await prisma.watchlist.findFirst({
    where: { ownerId: userId, isDefault: true },
  });
  if (!defaultWatchlist) {
    return { items: [], watching: [], wantToWatch: [], finished: [] };
  }

  const rows = await prisma.watchlistItemList.findMany({
    where: { watchlistId: defaultWatchlist.id },
    include: { watchlistItem: true },
    orderBy: { addedAt: 'desc' },
  });

  const items: WatchlistRow[] = rows.map((row) => ({
    id: row.watchlistItem.id,
    title: row.watchlistItem.title,
    type: row.watchlistItem.type,
    status: row.status,
    rating: row.rating,
    notes: row.notes,
    tmdbId: row.watchlistItem.tmdbId,
    tmdbPosterPath: row.watchlistItem.tmdbPosterPath,
    tmdbOverview: row.watchlistItem.tmdbOverview,
    tmdbMovieReleaseYear: row.watchlistItem.tmdbMovieReleaseYear,
    tmdbTvFirstAirYear: row.watchlistItem.tmdbTvFirstAirYear,
    tmdbMovieRuntime: row.watchlistItem.tmdbMovieRuntime,
    tmdbTvNumberOfSeasons: row.watchlistItem.tmdbTvNumberOfSeasons,
    tmdbMovieCertification: row.watchlistItem.tmdbMovieCertification,
    tmdbTvCertification: row.watchlistItem.tmdbTvCertification,
  }));

  return {
    items,
    watching: items.filter((i) => i.status === 'watching'),
    wantToWatch: items.filter((i) => i.status === 'want-to-watch'),
    finished: items.filter((i) => i.status === 'finished'),
  };
}

function watchingPayload(rows: WatchlistRow[]) {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    tmdbPosterPath: row.tmdbPosterPath,
    year: row.tmdbMovieReleaseYear ?? row.tmdbTvFirstAirYear,
  }));
}

async function fillTvEpisodeLengths(
  cache: TonightPickCache,
  items: WatchlistRow[]
): Promise<TonightPickCache> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return cache;
  const tmdb = new TMDB(apiKey);
  const candidates = await Promise.all(
    cache.candidates.map(async (candidate) => {
      if (candidate.type === 'movie' || candidate.runtimeMinutes != null) return candidate;
      const row = items.find((i) => i.id === candidate.id);
      if (!row?.tmdbId) return candidate;
      try {
        const details = await tmdb.tvShows.details(row.tmdbId);
        const runtimes = (details as { episode_run_time?: number[] }).episode_run_time;
        const minutes = Array.isArray(runtimes)
          ? runtimes.find((n) => typeof n === 'number' && n > 0)
          : undefined;
        if (minutes == null) return candidate;
        return { ...candidate, runtimeMinutes: minutes };
      } catch {
        return candidate;
      }
    })
  );
  return { ...cache, candidates };
}

function resolveRequestedContext(raw: unknown, isPro: boolean): TonightContext {
  if (!isPro) return DEFAULT_TONIGHT_CONTEXT;
  return parseTonightContext(raw) ?? DEFAULT_TONIGHT_CONTEXT;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function persistCache(userId: string, cache: TonightPickCache) {
  await prisma.user.update({
    where: { id: userId },
    data: { tonightPickCache: cache },
  });
}

function pickResponse(opts: {
  cache: TonightPickCache;
  watching: WatchlistRow[];
  isPro: boolean;
  listCount: number;
  claudeCalled: boolean;
  fromCache: boolean;
}) {
  return {
    empty: false as const,
    minListSize: TONIGHT_MIN_LIST_SIZE,
    listCount: opts.listCount,
    isPro: opts.isPro,
    context: opts.isPro ? opts.cache.context : DEFAULT_TONIGHT_CONTEXT,
    pick: visibleTonightCandidate(opts.cache),
    candidateCount: opts.cache.candidates.length,
    shownIndex: opts.cache.shownIndex,
    generatedAt: opts.cache.generatedAt,
    localDate: opts.cache.localDate,
    watching: watchingPayload(opts.watching),
    claudeCalled: opts.claudeCalled,
    fromCache: opts.fromCache,
  };
}

async function generateAndStore(opts: {
  userId: string;
  wantToWatch: WatchlistRow[];
  finished: WatchlistRow[];
  watching: WatchlistRow[];
  context: TonightContext;
  localDate: string;
  timeOfDay: string;
  isPro: boolean;
  listCount: number;
}) {
  const generated = await generateTonightCandidates({
    candidates: opts.wantToWatch,
    finished: opts.finished,
    context: opts.context,
    timeOfDay: opts.timeOfDay,
  });
  let cache = buildTonightPickCache({
    localDate: opts.localDate,
    context: opts.context,
    candidates: generated.candidates,
  });
  cache = await fillTvEpisodeLengths(cache, opts.wantToWatch);
  await persistCache(opts.userId, cache);
  console.log(
    JSON.stringify({
      event: 'tonight_pick_generated',
      ts: new Date().toISOString(),
      claudeCalled: generated.claudeCalled,
      candidateCount: cache.candidates.length,
    })
  );
  return pickResponse({
    cache,
    watching: opts.watching,
    isPro: opts.isPro,
    listCount: opts.listCount,
    claudeCalled: generated.claudeCalled,
    fromCache: false,
  });
}

export async function GET(request: NextRequest) {
  const user = await getSupabaseRouteUser();
  if (!user) return jsonError('Unauthorized', 401);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { timezone: true, tonightPickCache: true, subscriptionStatus: true, isAdmin: true },
  });
  if (!dbUser) return jsonError('Unauthorized', 401);

  const isPro = hasProAccess(dbUser);
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const requestedContext = resolveRequestedContext(
    {
      time: searchParams.get('time'),
      who: searchParams.get('who'),
      energy: searchParams.get('energy'),
    },
    isPro
  );

  const timeCtx = resolveRecommendationsTimeContext({
    clientHour: null,
    storedTimeZone: dbUser.timezone,
  });
  const localDate =
    (dbUser.timezone && localDateInTimeZone(dbUser.timezone)) ||
    new Date().toISOString().slice(0, 10);

  const list = await loadWatchlist(user.id);

  if (list.items.length < TONIGHT_MIN_LIST_SIZE) {
    return NextResponse.json({
      empty: true,
      minListSize: TONIGHT_MIN_LIST_SIZE,
      listCount: list.items.length,
      isPro,
      watching: watchingPayload(list.watching),
      claudeCalled: false,
      fromCache: false,
    });
  }

  const existing = parseTonightPickCache(dbUser.tonightPickCache);
  const cacheOk = existing && isTonightCacheFresh(existing, localDate);
  const contextMatches = existing ? tonightContextEquals(existing.context, requestedContext) : false;

  if (cacheOk && existing && !forceRefresh && (contextMatches || !isPro)) {
    console.log(
      JSON.stringify({
        event: 'tonight_pick_cache_hit',
        ts: new Date().toISOString(),
        claudeCalled: false,
      })
    );
    return NextResponse.json(
      pickResponse({
        cache: existing,
        watching: list.watching,
        isPro,
        listCount: list.items.length,
        claudeCalled: false,
        fromCache: true,
      })
    );
  }

  if (!isPro && forceRefresh && cacheOk && existing) {
    return jsonError('pro_required', 403);
  }

  const pool = list.wantToWatch.length > 0 ? list.wantToWatch : list.items;
  const body = await generateAndStore({
    userId: user.id,
    wantToWatch: pool,
    finished: list.finished,
    watching: list.watching,
    context: requestedContext,
    localDate,
    timeOfDay: timeCtx.bucket,
    isPro,
    listCount: list.items.length,
  });
  return NextResponse.json(body);
}

export async function POST(request: NextRequest) {
  const user = await getSupabaseRouteUser();
  if (!user) return jsonError('Unauthorized', 401);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { timezone: true, tonightPickCache: true, subscriptionStatus: true, isAdmin: true },
  });
  if (!dbUser) return jsonError('Unauthorized', 401);

  const isPro = hasProAccess(dbUser);
  const body = await request.json().catch(() => null);
  const action =
    body && typeof body === 'object' ? (body as { action?: unknown }).action : null;

  const list = await loadWatchlist(user.id);

  const localDate =
    (dbUser.timezone && localDateInTimeZone(dbUser.timezone)) ||
    new Date().toISOString().slice(0, 10);
  const timeCtx = resolveRecommendationsTimeContext({
    clientHour: null,
    storedTimeZone: dbUser.timezone,
  });

  if (action === 'not_tonight') {
    if (!isPro) return jsonError('pro_required', 403);
    const existing = parseTonightPickCache(dbUser.tonightPickCache);
    if (!existing || !isTonightCacheFresh(existing, localDate)) {
      return jsonError('no_pick', 404);
    }
    const next = {
      ...existing,
      shownIndex: nextTonightShownIndex(existing.shownIndex, existing.candidates.length),
    };
    await persistCache(user.id, next);
    return NextResponse.json(
      pickResponse({
        cache: next,
        watching: list.watching,
        isPro,
        listCount: list.items.length,
        claudeCalled: false,
        fromCache: true,
      })
    );
  }

  if (action === 'pick_again') {
    if (!isPro) return jsonError('pro_required', 403);
    const requestedContext = resolveRequestedContext(
      body && typeof body === 'object' ? (body as { context?: unknown }).context : null,
      true
    );
    if (list.items.length < TONIGHT_MIN_LIST_SIZE) {
      return NextResponse.json({
        empty: true,
        minListSize: TONIGHT_MIN_LIST_SIZE,
        listCount: list.items.length,
        isPro,
        watching: watchingPayload(list.watching),
        claudeCalled: false,
        fromCache: false,
      });
    }
    const pool = list.wantToWatch.length > 0 ? list.wantToWatch : list.items;
    const payload = await generateAndStore({
      userId: user.id,
      wantToWatch: pool,
      finished: list.finished,
      watching: list.watching,
      context: requestedContext,
      localDate,
      timeOfDay: timeCtx.bucket,
      isPro,
      listCount: list.items.length,
    });
    return NextResponse.json(payload);
  }

  return jsonError('Invalid action', 400);
}
