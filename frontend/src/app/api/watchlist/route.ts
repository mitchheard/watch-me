import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getUserId() {
  const cookieStore = await cookies();
  console.log('All cookies:', cookieStore.getAll()); // Debug log
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

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  return session.user.id;
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
    const body = await request.json();
    const { title, type, status, currentSeason, totalSeasons } = body;

    if (!title || !type || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        userId,
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
    const body = await request.json();
    const { id, title, type, status, currentSeason, totalSeasons } = body;

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
      where: { id },
      data: {
        title,
        type,
        status,
        currentSeason,
        totalSeasons,
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