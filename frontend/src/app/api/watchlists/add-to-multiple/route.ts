import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
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

    const body = await request.json();
    const { tmdbId, watchlistIds, status, rating, notes, title, type } = body;

    if (!tmdbId || !watchlistIds || !Array.isArray(watchlistIds) || watchlistIds.length === 0) {
      return NextResponse.json(
        { error: 'TMDB ID and watchlist IDs are required' },
        { status: 400 }
      );
    }

    // Verify user has access to all watchlists
    const watchlists = await prisma.watchlist.findMany({
      where: {
        id: { in: watchlistIds },
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

    if (watchlists.length !== watchlistIds.length) {
      return NextResponse.json(
        { error: 'One or more watchlists not found or access denied' },
        { status: 404 }
      );
    }

    // Find or create the WatchlistItem
    let watchlistItem = await prisma.watchlistItem.findUnique({
      where: { tmdbId: parseInt(tmdbId) }
    });

    if (!watchlistItem) {
      watchlistItem = await prisma.watchlistItem.create({
        data: {
          tmdbId: parseInt(tmdbId),
          title: title || 'Unknown Title',
          type: type || 'movie'
        }
      });
    }

    const results = [];

    // Add item to each watchlist
    for (const watchlist of watchlists) {
      // Check if item already exists in this watchlist
      const existingItem = await prisma.watchlistItemList.findFirst({
        where: {
          watchlistId: watchlist.id,
          watchlistItemId: watchlistItem.id
        }
      });

      if (existingItem) {
        results.push({
          watchlistId: watchlist.id,
          watchlistName: watchlist.name,
          status: 'already_exists',
          item: existingItem
        });
        continue;
      }

      // Determine default status based on watchlist type
      const defaultStatus = watchlist.isShared ? 'Want to Watch' : (status || 'Want to Watch');

      // Add item to watchlist
      const watchlistItemList = await prisma.watchlistItemList.create({
        data: {
          watchlistId: watchlist.id,
          watchlistItemId: watchlistItem.id,
          status: defaultStatus,
          rating: rating || null,
          notes: notes || null
        },
        include: {
          watchlistItem: true
        }
      });

      results.push({
        watchlistId: watchlist.id,
        watchlistName: watchlist.name,
        status: 'added',
        item: watchlistItemList
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
                rating: rating !== undefined ? rating : existingPersonalItem.rating,
                notes: notes !== undefined ? notes : existingPersonalItem.notes
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ 
      results,
      watchlistItem 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding item to multiple watchlists:', error);
    return NextResponse.json(
      { error: 'Failed to add item to watchlists' },
      { status: 500 }
    );
  }
}
