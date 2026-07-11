import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { WatchlistFormData } from '@/types/watchlist';
import { notifyFirstItem, notifyFirstReview } from '@/lib/adminNotifications';
import { FREE_WATCHLIST_ITEM_LIMIT, hasProAccess } from '@/lib/subscription';

async function getUserId() {
  const cookieStore = await cookies();
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
    console.error('Error getting user or no user:', error);
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

    // Find user's default watchlist
    const defaultWatchlist = await prisma.watchlist.findFirst({
      where: {
        ownerId: _userId,
        isDefault: true
      }
    });

    if (!defaultWatchlist) {
      // Create default watchlist if it doesn't exist
      await prisma.watchlist.create({
        data: {
          name: 'My Watchlist',
          description: 'Your personal watchlist',
          isDefault: true,
          isShared: false,
          ownerId: _userId
        }
      });
      
      return NextResponse.json([]); // Return empty array for new user
    }

    if (id) {
      // Return a single item by id from the new system
      const watchlistItemList = await prisma.watchlistItemList.findFirst({
        where: {
          watchlistId: defaultWatchlist.id,
          watchlistItemId: id
        },
        include: {
          watchlistItem: true
        }
      });

      if (!watchlistItemList) {
        return NextResponse.json(null);
      }

      // Transform to old format for compatibility
      const item = {
        id: watchlistItemList.watchlistItem.id,
        tmdbId: watchlistItemList.watchlistItem.tmdbId,
        title: watchlistItemList.watchlistItem.title,
        type: watchlistItemList.watchlistItem.type,
        status: watchlistItemList.status,
        rating: watchlistItemList.rating,
        notes: watchlistItemList.notes,
        createdAt: watchlistItemList.addedAt,
        updatedAt: watchlistItemList.updatedAt,
        userId: _userId,
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
        tmdbPopularity: watchlistItemList.watchlistItem.tmdbPopularity,
        tmdbVoteCount: watchlistItemList.watchlistItem.tmdbVoteCount,
      };

      return NextResponse.json(item);
    }

    // Return all items from the default watchlist
    const watchlistItemLists = await prisma.watchlistItemList.findMany({
      where: { watchlistId: defaultWatchlist.id },
      include: {
        watchlistItem: true
      },
      orderBy: { addedAt: 'desc' }
    });

    // Transform to old format for compatibility
    const items = watchlistItemLists.map(itemList => ({
      id: itemList.watchlistItem.id,
      tmdbId: itemList.watchlistItem.tmdbId,
      title: itemList.watchlistItem.title,
      type: itemList.watchlistItem.type,
      status: itemList.status,
      rating: itemList.rating,
      notes: itemList.notes,
      createdAt: itemList.addedAt,
      updatedAt: itemList.updatedAt,
      userId: _userId,
      currentSeason: null,
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
      tmdbPopularity: itemList.watchlistItem.tmdbPopularity,
      tmdbVoteCount: itemList.watchlistItem.tmdbVoteCount,
    }));

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
    
    // Find or create user's default watchlist
    let defaultWatchlist = await prisma.watchlist.findFirst({
      where: {
        ownerId: _userId,
        isDefault: true
      }
    });

    if (!defaultWatchlist) {
      defaultWatchlist = await prisma.watchlist.create({
        data: {
          name: 'My Watchlist',
          description: 'Your personal watchlist',
          isDefault: true,
          isShared: false,
          ownerId: _userId
        }
      });
    }
    
    // Check if this is the user's first item (+ subscription for free-tier cap)
    const [existingItems, userSub] = await Promise.all([
      prisma.watchlistItemList.count({
        where: { watchlistId: defaultWatchlist.id },
      }),
      prisma.user.findUnique({
        where: { id: _userId },
        select: { subscriptionStatus: true, isAdmin: true },
      }),
    ]);
    
    // Find or create the WatchlistItem
    let watchlistItem = await prisma.watchlistItem.findUnique({
      where: { tmdbId: data.tmdbId || 0 }
    });

    const popularityPatch: { tmdbPopularity?: number | null; tmdbVoteCount?: number | null } = {};
    if (data.tmdbPopularity != null) popularityPatch.tmdbPopularity = data.tmdbPopularity;
    if (data.tmdbVoteCount != null) popularityPatch.tmdbVoteCount = data.tmdbVoteCount;

    if (!watchlistItem) {
      watchlistItem = await prisma.watchlistItem.create({
        data: {
          tmdbId: data.tmdbId || 0,
          title: data.title,
          type: data.type,
          tmdbImdbId: data.tmdbImdbId || null,
          tmdbMovieCertification: data.tmdbMovieCertification || null,
          tmdbMovieReleaseYear: data.tmdbMovieReleaseYear || null,
          tmdbMovieRuntime: data.tmdbMovieRuntime || null,
          tmdbOverview: data.tmdbOverview || null,
          tmdbPosterPath: data.tmdbPosterPath || null,
          tmdbTagline: data.tmdbTagline || null,
          tmdbTvCertification: data.tmdbTvCertification || null,
          tmdbTvFirstAirYear: data.tmdbTvFirstAirYear || null,
          tmdbTvLastAirYear: data.tmdbTvLastAirYear || null,
          tmdbTvNetworks: data.tmdbTvNetworks || null,
          tmdbTvNumberOfEpisodes: data.tmdbTvNumberOfEpisodes || null,
          tmdbTvNumberOfSeasons: data.tmdbTvNumberOfSeasons || null,
          tmdbTvStatus: data.tmdbTvStatus || null,
          tmdbPopularity: data.tmdbPopularity ?? null,
          tmdbVoteCount: data.tmdbVoteCount ?? null,
        }
      });
    } else if (Object.keys(popularityPatch).length > 0) {
      watchlistItem = await prisma.watchlistItem.update({
        where: { id: watchlistItem.id },
        data: popularityPatch,
      });
    }

    // Check if item is already in this watchlist
    const existingWatchlistItem = await prisma.watchlistItemList.findFirst({
      where: {
        watchlistId: defaultWatchlist.id,
        watchlistItemId: watchlistItem.id
      }
    });

    if (existingWatchlistItem) {
      return NextResponse.json(
        { error: 'This title is already in your watchlist.' },
        { status: 409 }
      );
    }

    if (existingItems >= FREE_WATCHLIST_ITEM_LIMIT && !hasProAccess(userSub)) {
      return NextResponse.json({ error: 'limit_reached' }, { status: 403 });
    }

    // Add item to watchlist
    const watchlistItemList = await prisma.watchlistItemList.create({
      data: {
        watchlistId: defaultWatchlist.id,
        watchlistItemId: watchlistItem.id,
        status: data.status || 'want-to-watch',
        rating: data.rating || null,
        notes: data.notes || null
      },
      include: {
        watchlistItem: true
      }
    });
    
    // If this was the user's first item, send admin notification
    if (existingItems === 0) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: _userId },
        });
        
        if (user?.email) {
          await notifyFirstItem(
            _userId,
            user.email,
            data.title,
            data.type
          );
        }
      } catch (notificationError) {
        console.error('Failed to send first item notification:', notificationError);
        // Non-critical, so we just log and continue
      }
    }
    
    // Transform to old format for compatibility
    const item = {
      id: watchlistItemList.watchlistItem.id,
      tmdbId: watchlistItemList.watchlistItem.tmdbId,
      title: watchlistItemList.watchlistItem.title,
      type: watchlistItemList.watchlistItem.type,
      status: watchlistItemList.status,
      rating: watchlistItemList.rating,
      notes: watchlistItemList.notes,
      createdAt: watchlistItemList.addedAt,
      updatedAt: watchlistItemList.updatedAt,
      userId: _userId,
      currentSeason: data.currentSeason ? Number(data.currentSeason) : null,
      totalSeasons: data.totalSeasons ? Number(data.totalSeasons) : null,
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
      tmdbPopularity: watchlistItemList.watchlistItem.tmdbPopularity,
      tmdbVoteCount: watchlistItemList.watchlistItem.tmdbVoteCount,
    };
    
    return NextResponse.json(item);
  } catch (error) {
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

    // Find user's default watchlist
    const defaultWatchlist = await prisma.watchlist.findFirst({
      where: {
        ownerId: _userId,
        isDefault: true
      }
    });

    if (!defaultWatchlist) {
      return NextResponse.json({ error: 'Default watchlist not found' }, { status: 404 });
    }

    // Find the watchlist item list entry by watchlistItemId
    const watchlistItemList = await prisma.watchlistItemList.findFirst({
      where: {
        watchlistId: defaultWatchlist.id,
        watchlistItemId: id
      },
      include: {
        watchlistItem: true
      }
    });

    if (!watchlistItemList) {
      console.log('PUT /api/watchlist - Item not found in new schema, trying old schema');
      
      // Try old schema (watchItem) - but only if ID is numeric
      if (!isNaN(Number(id))) {
        const oldItem = await prisma.watchItem.findFirst({
          where: {
            id: parseInt(id),
            userId: _userId
          }
        });

        if (oldItem) {
          // Update old schema item
          const updateFields: Record<string, unknown> = { updatedAt: new Date() };
          for (const key in updateData) {
            if (Object.prototype.hasOwnProperty.call(updateData, key)) {
              updateFields[key] = updateData[key];
            }
          }

          const updatedOldItem = await prisma.watchItem.update({
            where: { id: parseInt(id) },
            data: updateFields
          });

          return NextResponse.json(updatedOldItem);
        }
      }
      
      console.log('PUT /api/watchlist - Item not found in any schema');
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    console.log('PUT /api/watchlist - Found watchlist item list:', watchlistItemList.id);

    // Check if this is adding a rating for the first time
    const isAddingRating = updateData.rating && !watchlistItemList.rating;

    // Only update fields that are present in the request and valid for watchlistItemList
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    
    // Only allow specific fields that exist on the watchlistItemList table
    if (updateData.status !== undefined) updateFields.status = updateData.status;
    if (updateData.rating !== undefined) updateFields.rating = updateData.rating;
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes;

    // Update the watchlist item list entry
    const updatedWatchlistItemList = await prisma.watchlistItemList.update({
      where: { id: watchlistItemList.id },
      data: updateFields,
      include: {
        watchlistItem: true
      }
    });

    // If this was the user's first review, send admin notification
    if (isAddingRating) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: _userId },
        });
        
        if (user?.email) {
          await notifyFirstReview(
            _userId,
            user.email,
            updatedWatchlistItemList.watchlistItem.title,
            updateData.rating as string
          );
        }
      } catch (notificationError) {
        console.error('Failed to send first review notification:', notificationError);
        // Non-critical, so we just log and continue
      }
    }

    // Return a simple success response
    return NextResponse.json({ 
      success: true, 
      id: updatedWatchlistItemList.watchlistItem.id,
      status: updatedWatchlistItemList.status,
      rating: updatedWatchlistItemList.rating
    });
  } catch (error) {
    console.error('Failed to update watchlist item:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Failed to update watchlist item' }, { status: 500 });
  }
}

// DELETE /api/watchlist
export async function DELETE(request: Request) {
  try {
    const _userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    // First try to find by watchlistItemList.id (direct ID match)
    const watchlistItemListById = await prisma.watchlistItemList.findFirst({
      where: {
        id: id,
        watchlist: { ownerId: _userId }
      }
    });

    if (watchlistItemListById) {
      // Delete from new schema by direct ID
      await prisma.watchlistItemList.delete({
        where: { id: id }
      });
      return NextResponse.json({ success: true });
    }

    // If not found by direct ID, try to find by watchlistItemId (the item ID)
    const watchlistItemListByItemId = await prisma.watchlistItemList.findFirst({
      where: {
        watchlistItemId: id,
        watchlist: { ownerId: _userId }
      }
    });

    if (watchlistItemListByItemId) {
      // Delete from new schema by item ID
      await prisma.watchlistItemList.delete({
        where: { id: watchlistItemListByItemId.id }
      });
      return NextResponse.json({ success: true });
    }

    // If not found in new schema, try old schema (watchItem)
    const oldItem = await prisma.watchItem.findFirst({
      where: {
        id: parseInt(id), // Old schema uses integer IDs
        userId: _userId
      }
    });

    if (oldItem) {
      // Delete from old schema
      await prisma.watchItem.delete({
        where: { id: parseInt(id) }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Item not found or not authorized' }, { status: 404 });
  } catch (error) {
    console.error('Failed to delete watchlist item:', error);
    return NextResponse.json({ error: 'Failed to delete watchlist item' }, { status: 500 });
  }
} 