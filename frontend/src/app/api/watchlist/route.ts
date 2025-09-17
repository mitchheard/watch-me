import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { WatchlistFormData } from '@/types/watchlist';
import { notifyFirstItem, notifyFirstReview } from '@/lib/adminNotifications';

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
      // Return a single item by id - find in watchlistItemList first
      const watchlistItemList = await prisma.watchlistItemList.findFirst({
        where: { 
          id: id,
          watchlist: { ownerId: _userId }
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
        id: watchlistItemList.id,
        userId: _userId,
        title: watchlistItemList.watchlistItem.title,
        type: watchlistItemList.watchlistItem.type,
        status: watchlistItemList.status,
        rating: watchlistItemList.rating,
        notes: watchlistItemList.notes,
        tmdbId: watchlistItemList.watchlistItem.tmdbId,
        tmdbPosterPath: watchlistItemList.watchlistItem.tmdbPosterPath,
        tmdbOverview: watchlistItemList.watchlistItem.tmdbOverview,
        tmdbMovieReleaseYear: watchlistItemList.watchlistItem.tmdbMovieReleaseYear,
        tmdbTvFirstAirYear: watchlistItemList.watchlistItem.tmdbTvFirstAirYear,
        tmdbMovieRuntime: watchlistItemList.watchlistItem.tmdbMovieRuntime,
        tmdbTvNumberOfSeasons: watchlistItemList.watchlistItem.tmdbTvNumberOfSeasons,
        updatedAt: watchlistItemList.updatedAt,
        createdAt: watchlistItemList.watchlistItem.createdAt
      };
      
      return NextResponse.json(item);
    }

    // Get user's default watchlist
    const defaultWatchlist = await prisma.watchlist.findFirst({
      where: {
        ownerId: _userId,
        isDefault: true
      }
    });

    if (!defaultWatchlist) {
      return NextResponse.json([]);
    }

    // Get items from the default watchlist
    const watchlistItems = await prisma.watchlistItemList.findMany({
      where: {
        watchlistId: defaultWatchlist.id
      },
      include: {
        watchlistItem: true
      },
      orderBy: { addedAt: 'desc' }
    });

    // Transform to old format for compatibility
    const items = watchlistItems.map(item => ({
      id: item.id,
      userId: _userId,
      title: item.watchlistItem.title,
      type: item.watchlistItem.type,
      status: item.status,
      rating: item.rating,
      notes: item.notes,
      tmdbId: item.watchlistItem.tmdbId,
      tmdbPosterPath: item.watchlistItem.tmdbPosterPath,
      tmdbOverview: item.watchlistItem.tmdbOverview,
      tmdbMovieReleaseYear: item.watchlistItem.tmdbMovieReleaseYear,
      tmdbTvFirstAirYear: item.watchlistItem.tmdbTvFirstAirYear,
      tmdbMovieRuntime: item.watchlistItem.tmdbMovieRuntime,
      tmdbTvNumberOfSeasons: item.watchlistItem.tmdbTvNumberOfSeasons,
      updatedAt: item.updatedAt,
      createdAt: item.watchlistItem.createdAt
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
    
    // Get or create default watchlist
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
          ownerId: _userId,
          isDefault: true,
          isShared: false
        }
      });
    }
    
    // Check if this is the user's first item
    const existingItems = await prisma.watchlistItemList.count({
      where: { 
        watchlist: { ownerId: _userId }
      },
    });
    
    // Check if item already exists in this watchlist
    const existingItem = await prisma.watchlistItem.findFirst({
      where: {
        title: data.title,
        type: data.type,
        watchlistItemLists: {
          some: {
            watchlistId: defaultWatchlist.id
          }
        }
      }
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'This title is already in your watchlist.' },
        { status: 409 }
      );
    }
    
    // Create the watchlist item
    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        title: data.title,
        type: data.type,
        tmdbId: data.tmdbId || Math.floor(Math.random() * 1000000) + 1,
        tmdbPosterPath: data.tmdbPosterPath || null,
        tmdbOverview: data.tmdbOverview || null,
        tmdbMovieReleaseYear: data.tmdbMovieReleaseYear || null,
        tmdbTvFirstAirYear: data.tmdbTvFirstAirYear || null,
        tmdbMovieRuntime: data.tmdbMovieRuntime || null,
        tmdbTvNumberOfSeasons: data.tmdbTvNumberOfSeasons || null,
      }
    });
    
    // Add it to the watchlist
    const watchlistItemList = await prisma.watchlistItemList.create({
      data: {
        watchlistId: defaultWatchlist.id,
        watchlistItemId: watchlistItem.id,
        status: data.status,
        addedAt: new Date()
      }
    });
    
    // Transform to old format for compatibility
    const item = {
      id: watchlistItemList.id,
      userId: _userId,
      title: watchlistItem.title,
      type: watchlistItem.type,
      status: watchlistItemList.status,
      rating: watchlistItemList.rating,
      notes: watchlistItemList.notes,
      tmdbId: watchlistItem.tmdbId,
      tmdbPosterPath: watchlistItem.tmdbPosterPath,
      tmdbOverview: watchlistItem.tmdbOverview,
      tmdbMovieReleaseYear: watchlistItem.tmdbMovieReleaseYear,
      tmdbTvFirstAirYear: watchlistItem.tmdbTvFirstAirYear,
      tmdbMovieRuntime: watchlistItem.tmdbMovieRuntime,
      tmdbTvNumberOfSeasons: watchlistItem.tmdbTvNumberOfSeasons,
      updatedAt: watchlistItemList.updatedAt,
      createdAt: watchlistItem.createdAt
    };
    
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

    // Find the watchlist item list
    const watchlistItemList = await prisma.watchlistItemList.findFirst({
      where: { 
        id: id,
        watchlist: { ownerId: _userId }
      },
      include: {
        watchlistItem: true
      }
    });

    if (!watchlistItemList) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check if this is adding a rating for the first time
    const isAddingRating = updateData.rating && !watchlistItemList.rating;

    // Only update fields that are present in the request
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    for (const key in updateData) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        updateFields[key] = updateData[key];
      }
    }

    const updatedItem = await prisma.watchlistItemList.update({
      where: { id: id },
      data: updateFields,
      include: {
        watchlistItem: true
      }
    });

    // Transform to old format for compatibility
    const item = {
      id: updatedItem.id,
      userId: _userId,
      title: updatedItem.watchlistItem.title,
      type: updatedItem.watchlistItem.type,
      status: updatedItem.status,
      rating: updatedItem.rating,
      notes: updatedItem.notes,
      tmdbId: updatedItem.watchlistItem.tmdbId,
      tmdbPosterPath: updatedItem.watchlistItem.tmdbPosterPath,
      tmdbOverview: updatedItem.watchlistItem.tmdbOverview,
      tmdbMovieReleaseYear: updatedItem.watchlistItem.tmdbMovieReleaseYear,
      tmdbTvFirstAirYear: updatedItem.watchlistItem.tmdbTvFirstAirYear,
      tmdbMovieRuntime: updatedItem.watchlistItem.tmdbMovieRuntime,
      tmdbTvNumberOfSeasons: updatedItem.watchlistItem.tmdbTvNumberOfSeasons,
      updatedAt: updatedItem.updatedAt,
      createdAt: updatedItem.watchlistItem.createdAt
    };

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
            item.title,
            updateData.rating as string
          );
        }
      } catch (notificationError) {
        console.error('Failed to send first review notification:', notificationError);
        // Non-critical, so we just log and continue
      }
    }

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
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    // Find the watchlist item list to verify ownership
    const watchlistItemList = await prisma.watchlistItemList.findFirst({
      where: { 
        id: id,
        watchlist: { ownerId: _userId }
      }
    });

    if (!watchlistItemList) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    // Delete the watchlist item list entry
    await prisma.watchlistItemList.delete({
      where: { id: id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete watchlist item:', error);
    return NextResponse.json({ error: 'Failed to delete watchlist item' }, { status: 500 });
  }
} 