import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ watchlistId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { watchlistId } = await params;

    // Verify user has access to this watchlist
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        OR: [
          { ownerId: user.id },
          { 
            members: {
              some: { userId: user.id }
            }
          }
        ]
      }
    });

    if (!watchlist) {
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
    }

    // Get items in this watchlist
    const watchlistItemLists = await prisma.watchlistItemList.findMany({
      where: { watchlistId },
      include: {
        watchlistItem: true
      },
      orderBy: { addedAt: 'desc' }
    });

    // Transform the data to match the expected WatchItem interface
    const items = watchlistItemLists.map(itemList => ({
      id: itemList.watchlistItem.id, // Use the actual WatchItem ID
      tmdbId: itemList.watchlistItem.tmdbId,
      title: itemList.watchlistItem.title,
      type: itemList.watchlistItem.type,
      status: itemList.status,
      rating: itemList.rating,
      notes: itemList.notes,
      createdAt: itemList.addedAt, // Map addedAt to createdAt
      updatedAt: itemList.addedAt, // Use addedAt for updatedAt as well
      userId: user.id, // Add userId field
      currentSeason: null, // Add required fields with null values
      totalSeasons: null,
      tmdbImdbId: itemList.watchlistItem.tmdbImdbId,
      tmdbMovieCertification: itemList.watchlistItem.tmdbMovieCertification,
      tmdbMovieRuntime: itemList.watchlistItem.tmdbMovieRuntime,
      tmdbOverview: itemList.watchlistItem.tmdbOverview,
      tmdbPosterPath: itemList.watchlistItem.tmdbPosterPath,
      tmdbTagline: itemList.watchlistItem.tmdbTagline,
      tmdbTvCertification: itemList.watchlistItem.tmdbTvCertification,
      tmdbTvFirstAirYear: itemList.watchlistItem.tmdbTvFirstAirYear,
      tmdbTvLastAirYear: itemList.watchlistItem.tmdbTvLastAirYear,
      tmdbTvNetworks: itemList.watchlistItem.tmdbTvNetworks,
      tmdbTvNumberOfEpisodes: itemList.watchlistItem.tmdbTvNumberOfEpisodes,
      tmdbTvNumberOfSeasons: itemList.watchlistItem.tmdbTvNumberOfSeasons,
      tmdbTvStatus: itemList.watchlistItem.tmdbTvStatus,
      tmdbMovieReleaseYear: itemList.watchlistItem.tmdbMovieReleaseYear,
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching watchlist items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist items' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ watchlistId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { watchlistId } = await params;
    const body = await request.json();
    const { tmdbId, status, rating, notes } = body;

    if (!tmdbId) {
      return NextResponse.json(
        { error: 'TMDB ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this watchlist
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        OR: [
          { ownerId: user.id },
          { 
            members: {
              some: { userId: user.id }
            }
          }
        ]
      }
    });

    if (!watchlist) {
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
    }

    // Check if item already exists in this watchlist
    const existingItem = await prisma.watchlistItemList.findFirst({
      where: {
        watchlistId,
        watchlistItem: { tmdbId: parseInt(tmdbId) }
      }
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item already exists in this watchlist' },
        { status: 409 }
      );
    }

    // Find or create the WatchlistItem
    let watchlistItem = await prisma.watchlistItem.findUnique({
      where: { tmdbId: parseInt(tmdbId) }
    });

    if (!watchlistItem) {
      // Fetch TMDB data (you'll need to implement this)
      // For now, we'll create with minimal data
      watchlistItem = await prisma.watchlistItem.create({
        data: {
          tmdbId: parseInt(tmdbId),
          title: body.title || 'Unknown Title',
          type: body.type || 'movie'
        }
      });
    }

    // Determine default status based on watchlist type
    const defaultStatus = watchlist.isShared ? 'Want to Watch' : (status || 'Want to Watch');

    // Add item to watchlist
    const watchlistItemList = await prisma.watchlistItemList.create({
      data: {
        watchlistId,
        watchlistItemId: watchlistItem.id,
        status: defaultStatus,
        rating: rating || null,
        notes: notes || null
      },
      include: {
        watchlistItem: true
      }
    });

    // If status is "Watching" or "Finished" and this is a shared list,
    // also add/update in user's personal list
    if ((defaultStatus === 'Watching' || defaultStatus === 'Finished') && watchlist.isShared) {
      const personalWatchlist = await prisma.watchlist.findFirst({
        where: {
          ownerId: user.id,
          isDefault: true
        }
      });

      if (personalWatchlist) {
        // Check if item exists in personal list
        const existingPersonalItem = await prisma.watchlistItemList.findFirst({
          where: {
            watchlistId: personalWatchlist.id,
            watchlistItemId: watchlistItem.id
          }
        });

        if (!existingPersonalItem) {
          // Add to personal list
          await prisma.watchlistItemList.create({
            data: {
              watchlistId: personalWatchlist.id,
              watchlistItemId: watchlistItem.id,
              status: defaultStatus,
              rating: rating || null,
              notes: notes || null
            }
          });
        } else {
          // Update existing personal list item
          await prisma.watchlistItemList.update({
            where: { id: existingPersonalItem.id },
            data: {
              status: defaultStatus,
              rating: rating || existingPersonalItem.rating,
              notes: notes || existingPersonalItem.notes
            }
          });
        }
      }
    }

    // Transform the response to match the expected WatchItem interface
    const transformedItem = {
      id: watchlistItemList.watchlistItem.id,
      tmdbId: watchlistItemList.watchlistItem.tmdbId,
      title: watchlistItemList.watchlistItem.title,
      type: watchlistItemList.watchlistItem.type,
      status: watchlistItemList.status,
      rating: watchlistItemList.rating,
      notes: watchlistItemList.notes,
      createdAt: watchlistItemList.addedAt,
      updatedAt: watchlistItemList.addedAt,
      userId: user.id,
      currentSeason: null,
      totalSeasons: null,
      tmdbImdbId: watchlistItemList.watchlistItem.tmdbImdbId,
      tmdbMovieCertification: watchlistItemList.watchlistItem.tmdbMovieCertification,
      tmdbMovieRuntime: watchlistItemList.watchlistItem.tmdbMovieRuntime,
      tmdbOverview: watchlistItemList.watchlistItem.tmdbOverview,
      tmdbPosterPath: watchlistItemList.watchlistItem.tmdbPosterPath,
      tmdbTagline: watchlistItemList.watchlistItem.tmdbTagline,
      tmdbTvCertification: watchlistItemList.watchlistItem.tmdbTvCertification,
      tmdbTvFirstAirYear: watchlistItemList.watchlistItem.tmdbTvFirstAirYear,
      tmdbTvLastAirYear: watchlistItemList.watchlistItem.tmdbTvLastAirYear,
      tmdbTvNetworks: watchlistItemList.watchlistItem.tmdbTvNetworks,
      tmdbTvNumberOfEpisodes: watchlistItemList.watchlistItem.tmdbTvNumberOfEpisodes,
      tmdbTvNumberOfSeasons: watchlistItemList.watchlistItem.tmdbTvNumberOfSeasons,
      tmdbTvStatus: watchlistItemList.watchlistItem.tmdbTvStatus,
      tmdbMovieReleaseYear: watchlistItemList.watchlistItem.tmdbMovieReleaseYear,
    };

    return NextResponse.json(transformedItem, { status: 201 });
  } catch (error) {
    console.error('Error adding item to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add item to watchlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ watchlistId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { watchlistId } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this watchlist
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        OR: [
          { ownerId: user.id },
          { 
            members: {
              some: { userId: user.id }
            }
          }
        ]
      }
    });

    if (!watchlist) {
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
    }

    // Find and delete the item from this watchlist
    const watchlistItemList = await prisma.watchlistItemList.findFirst({
      where: {
        watchlistId,
        watchlistItemId: parseInt(itemId)
      }
    });

    if (!watchlistItemList) {
      return NextResponse.json({ error: 'Item not found in this watchlist' }, { status: 404 });
    }

    await prisma.watchlistItemList.delete({
      where: { id: watchlistItemList.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete item from watchlist' },
      { status: 500 }
    );
  }
}
