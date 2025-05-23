import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { WatchlistFormData } from '@/types/watchlist';

async function getUserId() {
  const cookieStore = await cookies();
  // console.log('All cookies:', cookieStore.getAll()); // Debug log - can be removed if not needed
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Required for server-side auth to correctly set/update cookies
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('Error getting user or no user:', error); // Added more detailed logging
    throw new Error('Not authenticated');
  }
  // Auto-create user in User table if not found
  const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!existingUser) {
    await prisma.user.create({ data: { id: user.id, email: user.email } });
  }
  return user.id;
}

// GET /api/watchlist or /api/watchlist?id=123
export async function GET(request: Request) {
  try {
    const _userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Return a single item by id
      const item = await prisma.watchItem.findUnique({
        where: { id: Number(id), userId: _userId },
      });
      return NextResponse.json(item);
    }

    // Otherwise, return all items
    const items = await prisma.watchItem.findMany({
      where: { userId: _userId },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch watchlist items:', error);
    return NextResponse.json({ error: 'Failed to fetch watchlist items' }, { status: 500 });
  }
}

// POST /api/watchlist
export async function POST(request: Request) {
  try {
    const _userId = await getUserId();
    const data: WatchlistFormData = await request.json();
    const item = await prisma.watchItem.create({
      data: {
        userId: _userId,
        title: data.title,
        type: data.type,
        status: data.status,
        currentSeason: data.currentSeason ? Number(data.currentSeason) : null,
        totalSeasons: data.totalSeasons ? Number(data.totalSeasons) : null,
        tmdbId: data.tmdbId || null,
        tmdbPosterPath: data.tmdbPosterPath || null,
        tmdbOverview: data.tmdbOverview || null,
        tmdbTagline: data.tmdbTagline || null,
        tmdbImdbId: data.tmdbImdbId || null,
        tmdbMovieCertification: data.tmdbMovieCertification || null,
        tmdbMovieReleaseYear: data.tmdbMovieReleaseYear || null,
        tmdbMovieRuntime: data.tmdbMovieRuntime || null,
        tmdbTvCertification: data.tmdbTvCertification || null,
        tmdbTvFirstAirYear: data.tmdbTvFirstAirYear || null,
        tmdbTvLastAirYear: data.tmdbTvLastAirYear || null,
        tmdbTvNetworks: data.tmdbTvNetworks || null,
        tmdbTvNumberOfEpisodes: data.tmdbTvNumberOfEpisodes || null,
        tmdbTvNumberOfSeasons: data.tmdbTvNumberOfSeasons || null,
        tmdbTvStatus: data.tmdbTvStatus || null,
        updatedAt: new Date(),
      }
    });
    return NextResponse.json(item);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002' &&
      'meta' in error &&
      typeof error.meta === 'object' &&
      error.meta !== null &&
      'target' in error.meta &&
      Array.isArray((error.meta as { target?: unknown }).target) &&
      ((error.meta as { target?: unknown }).target as unknown[]).includes('tmdbId')
    ) {
      return NextResponse.json(
        { error: 'This title is already in your watchlist.' },
        { status: 409 }
      );
    }
    console.error('Failed to create watchlist item:', error);
    return NextResponse.json({ error: 'Failed to create watchlist item' }, { status: 500 });
  }
}

// PUT /api/watchlist
export async function PUT(request: Request) {
  try {
    const _userId = await getUserId();
    const data = await request.json();
    const { id, ...updateData } = data;

    // Only update fields that are present in the request
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    for (const key in updateData) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        updateFields[key] = updateData[key];
      }
    }

    const item = await prisma.watchItem.update({
      where: { id, userId: _userId },
      data: updateFields,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update watchlist item:', error);
    return NextResponse.json({ error: 'Failed to update watchlist item' }, { status: 500 });
  }
}

// DELETE /api/watchlist
export async function DELETE(request: Request) {
  try {
    const _userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    await prisma.watchItem.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete watchlist item:', error);
    return NextResponse.json({ error: 'Failed to delete watchlist item' }, { status: 500 });
  }
} 