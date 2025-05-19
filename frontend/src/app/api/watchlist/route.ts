import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
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
  // Auto-create user in User table if not found
  const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!existingUser) {
    await prisma.user.create({ data: { id: user.id, email: user.email } });
  }
  return user.id;
}

// GET /api/watchlist
export async function GET() {
  try {
    const userId = await getUserId();
    const items = await prisma.watchItem.findMany({
      where: { userId },
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
    const userId = await getUserId();
    const data: WatchlistFormData = await request.json();
    const item = await prisma.watchItem.create({
      data: {
        userId,
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
    console.error('Failed to create watchlist item:', error);
    return NextResponse.json({ error: 'Failed to create watchlist item' }, { status: 500 });
  }
}

// PUT /api/watchlist
export async function PUT(request: Request) {
  try {
    const userId = await getUserId();
    const data: WatchlistFormData & { id: number } = await request.json();
    const { id, ...updateData } = data;
    
    const item = await prisma.watchItem.update({
      where: { id, userId },
      data: {
        ...updateData,
        currentSeason: updateData.currentSeason ? Number(updateData.currentSeason) : null,
        totalSeasons: updateData.totalSeasons ? Number(updateData.totalSeasons) : null,
        tmdbId: updateData.tmdbId || null,
        tmdbPosterPath: updateData.tmdbPosterPath || null,
        tmdbOverview: updateData.tmdbOverview || null,
        tmdbTagline: updateData.tmdbTagline || null,
        tmdbImdbId: updateData.tmdbImdbId || null,
        tmdbMovieCertification: updateData.tmdbMovieCertification || null,
        tmdbMovieReleaseYear: updateData.tmdbMovieReleaseYear || null,
        tmdbMovieRuntime: updateData.tmdbMovieRuntime || null,
        tmdbTvCertification: updateData.tmdbTvCertification || null,
        tmdbTvFirstAirYear: updateData.tmdbTvFirstAirYear || null,
        tmdbTvLastAirYear: updateData.tmdbTvLastAirYear || null,
        tmdbTvNetworks: updateData.tmdbTvNetworks || null,
        tmdbTvNumberOfEpisodes: updateData.tmdbTvNumberOfEpisodes || null,
        tmdbTvNumberOfSeasons: updateData.tmdbTvNumberOfSeasons || null,
        tmdbTvStatus: updateData.tmdbTvStatus || null,
        updatedAt: new Date(),
      }
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
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    await prisma.watchItem.delete({
      where: { id, userId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete watchlist item:', error);
    return NextResponse.json({ error: 'Failed to delete watchlist item' }, { status: 500 });
  }
} 