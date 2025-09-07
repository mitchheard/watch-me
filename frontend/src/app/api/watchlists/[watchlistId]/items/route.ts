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
      id: itemList.id,
      tmdbId: itemList.watchlistItem.tmdbId,
      title: itemList.watchlistItem.title,
      type: itemList.watchlistItem.type,
      status: itemList.status,
      rating: itemList.rating,
      notes: itemList.notes,
      addedAt: itemList.addedAt,
      tmdbPosterPath: itemList.watchlistItem.tmdbPosterPath,
      tmdbOverview: itemList.watchlistItem.tmdbOverview,
      tmdbMovieReleaseYear: itemList.watchlistItem.tmdbMovieReleaseYear,
      tmdbTvFirstAirYear: itemList.watchlistItem.tmdbTvFirstAirYear,
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

    return NextResponse.json({ item: watchlistItemList }, { status: 201 });
  } catch (error) {
    console.error('Error adding item to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add item to watchlist' },
      { status: 500 }
    );
  }
}
