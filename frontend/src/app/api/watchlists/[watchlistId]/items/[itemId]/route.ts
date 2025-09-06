import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { watchlistId: string; itemId: string } }
) {
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

    const { watchlistId, itemId } = params;
    const body = await request.json();
    const { status, rating, notes } = body;

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

    // Find the watchlist item
    const watchlistItemList = await prisma.watchlistItemList.findFirst({
      where: {
        id: itemId,
        watchlistId
      },
      include: {
        watchlistItem: true
      }
    });

    if (!watchlistItemList) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Update the item
    const updatedItem = await prisma.watchlistItemList.update({
      where: { id: itemId },
      data: {
        status: status || watchlistItemList.status,
        rating: rating !== undefined ? rating : watchlistItemList.rating,
        notes: notes !== undefined ? notes : watchlistItemList.notes,
        updatedAt: new Date()
      },
      include: {
        watchlistItem: true
      }
    });

    // If status is "Watching" or "Finished" and this is a shared list,
    // also update in user's personal list
    if ((status === 'Watching' || status === 'Finished') && watchlist.isShared) {
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
            watchlistItemId: watchlistItemList.watchlistItemId
          }
        });

        if (!existingPersonalItem) {
          // Add to personal list
          await prisma.watchlistItemList.create({
            data: {
              watchlistId: personalWatchlist.id,
              watchlistItemId: watchlistItemList.watchlistItemId,
              status: status,
              rating: rating || null,
              notes: notes || null
            }
          });
        } else {
          // Update existing personal list item
          await prisma.watchlistItemList.update({
            where: { id: existingPersonalItem.id },
            data: {
              status: status,
              rating: rating !== undefined ? rating : existingPersonalItem.rating,
              notes: notes !== undefined ? notes : existingPersonalItem.notes,
              updatedAt: new Date()
            }
          });
        }
      }
    }

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('Error updating watchlist item:', error);
    return NextResponse.json(
      { error: 'Failed to update watchlist item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { watchlistId: string; itemId: string } }
) {
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

    const { watchlistId, itemId } = params;

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

    // Find the watchlist item
    const watchlistItemList = await prisma.watchlistItemList.findFirst({
      where: {
        id: itemId,
        watchlistId
      }
    });

    if (!watchlistItemList) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Delete the item from this watchlist
    await prisma.watchlistItemList.delete({
      where: { id: itemId }
    });

    // Check if this item exists in any other watchlists
    const remainingItems = await prisma.watchlistItemList.findMany({
      where: {
        watchlistItemId: watchlistItemList.watchlistItemId
      }
    });

    // If item is not in any other watchlists, delete the WatchlistItem
    if (remainingItems.length === 0) {
      await prisma.watchlistItem.delete({
        where: { id: watchlistItemList.watchlistItemId }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting watchlist item:', error);
    return NextResponse.json(
      { error: 'Failed to delete watchlist item' },
      { status: 500 }
    );
  }
}
