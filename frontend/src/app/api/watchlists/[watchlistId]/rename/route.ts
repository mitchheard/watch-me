import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ watchlistId: string }> }
) {
  try {
    const { watchlistId } = await params;
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

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if user has permission to rename this watchlist (must be owner)
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        ownerId: user.id
      }
    });

    if (!watchlist) {
      return NextResponse.json({ error: 'Watchlist not found or no permission' }, { status: 404 });
    }

    // Update the watchlist name
    const updatedWatchlist = await prisma.watchlist.update({
      where: { id: watchlistId },
      data: { name: name.trim() }
    });

    return NextResponse.json({
      id: updatedWatchlist.id,
      name: updatedWatchlist.name
    });

  } catch (error) {
    console.error('Error renaming watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
