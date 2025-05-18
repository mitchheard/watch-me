import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { WatchItem } from '@/types/watchlist';

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        remove(name: string, options: any) {
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
  return user.id;
}

// GET /api/watchlist
export async function GET() {
  try {
    const userId = await getUserId();
    const watchlist = await prisma.watchItem.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// POST /api/watchlist
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    console.log(`[POST /api/watchlist] Attempting action for userId: ${userId}`); // Added log

    // Verify user exists in your public.User table
    const appUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!appUser) {
      console.error(`[POST /api/watchlist] User with ID ${userId} not found in the public.User table.`);
      return NextResponse.json(
        { error: 'User profile not found in application database. Cannot create watch item.' },
        { status: 404 } // Not Found, as the referenced user is missing
      );
    }

    const body: Partial<WatchItem> = await request.json();
    // Destructure all potential fields from the body, including new TMDB fields
    const {
      title, type, status, currentSeason, totalSeasons, notes, rating, // User-managed fields
      // TMDB common fields
      tmdbId, tmdbPosterPath, tmdbOverview, tmdbTagline, tmdbImdbId,
      // TMDB movie-specific fields
      tmdbMovieRuntime, tmdbMovieReleaseYear, tmdbMovieCertification,
      // TMDB TV-show-specific fields
      tmdbTvFirstAirYear, tmdbTvLastAirYear, tmdbTvNetworks,
      tmdbTvNumberOfEpisodes, tmdbTvNumberOfSeasons, tmdbTvStatus, tmdbTvCertification
    } = body;

    if (!title || !type || !status) {
      return NextResponse.json(
        { error: 'Missing required fields (title, type, status)' }, // Updated error message
        { status: 400 }
      );
    }

    const watchItem = await prisma.watchItem.create({
      data: {
        title,
        type,
        status,
        currentSeason,
        totalSeasons,
        notes, // Add notes
        rating, // Add rating
        userId,
        // Add all TMDB fields to the data object
        tmdbId,
        tmdbPosterPath,
        tmdbOverview,
        tmdbTagline,
        tmdbImdbId,
        tmdbMovieRuntime,
        tmdbMovieReleaseYear,
        tmdbMovieCertification,
        tmdbTvFirstAirYear,
        tmdbTvLastAirYear,
        tmdbTvNetworks,
        tmdbTvNumberOfEpisodes,
        tmdbTvNumberOfSeasons,
        tmdbTvStatus,
        tmdbTvCertification,
      },
    });

    return NextResponse.json(watchItem, { status: 201 });
  } catch (error) {
    console.error('Error creating watch item:', error);
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create watch item' },
      { status: 500 }
    );
  }
}

// PUT /api/watchlist
export async function PUT(request: Request) {
  try {
    const userId = await getUserId();
    const body: Partial<WatchItem> & { id?: number } = await request.json();
    // Destructure all potential fields, including item id and TMDB fields
    const {
      id, title, type, status, currentSeason, totalSeasons, notes, rating, // User-managed fields + id
      // TMDB common fields
      tmdbId, tmdbPosterPath, tmdbOverview, tmdbTagline, tmdbImdbId,
      // TMDB movie-specific fields
      tmdbMovieRuntime, tmdbMovieReleaseYear, tmdbMovieCertification,
      // TMDB TV-show-specific fields
      tmdbTvFirstAirYear, tmdbTvLastAirYear, tmdbTvNetworks,
      tmdbTvNumberOfEpisodes, tmdbTvNumberOfSeasons, tmdbTvStatus, tmdbTvCertification
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing item ID' },
        { status: 400 }
      );
    }

    // First check if the item belongs to the user
    const existingItem = await prisma.watchItem.findFirst({
      where: { id, userId },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found or unauthorized' },
        { status: 404 }
      );
    }

    const watchItem = await prisma.watchItem.update({
      where: { id }, // id is already an integer from the database
      data: {
        // Only include fields that are actually sent for update.
        // Prisma handles undefined fields by not updating them.
        title,
        type,
        status,
        currentSeason,
        totalSeasons,
        notes, // Add notes
        rating, // Add rating
        // Add all TMDB fields to the data object for update
        tmdbId,
        tmdbPosterPath,
        tmdbOverview,
        tmdbTagline,
        tmdbImdbId,
        tmdbMovieRuntime,
        tmdbMovieReleaseYear,
        tmdbMovieCertification,
        tmdbTvFirstAirYear,
        tmdbTvLastAirYear,
        tmdbTvNetworks,
        tmdbTvNumberOfEpisodes,
        tmdbTvNumberOfSeasons,
        tmdbTvStatus,
        tmdbTvCertification,
      },
    });

    return NextResponse.json(watchItem);
  } catch (error) {
    console.error('Error updating watch item:', error);
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update watch item' },
      { status: 500 }
    );
  }
}

// DELETE /api/watchlist
export async function DELETE(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing item ID' },
        { status: 400 }
      );
    }

    // First check if the item belongs to the user
    const existingItem = await prisma.watchItem.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.watchItem.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting watch item:', error);
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete watch item' },
      { status: 500 }
    );
  }
} 