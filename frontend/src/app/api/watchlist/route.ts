import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/watchlist
export async function GET() {
  try {
    const watchlist = await prisma.watchItem.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// POST /api/watchlist
export async function POST(request: Request) {
  try {
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
      },
    });

    return NextResponse.json(watchItem, { status: 201 });
  } catch (error) {
    console.error('Error creating watch item:', error);
    return NextResponse.json(
      { error: 'Failed to create watch item' },
      { status: 500 }
    );
  }
}

// PUT /api/watchlist
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, type, status, currentSeason, totalSeasons } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing item ID' },
        { status: 400 }
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
    return NextResponse.json(
      { error: 'Failed to update watch item' },
      { status: 500 }
    );
  }
}

// DELETE /api/watchlist
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing item ID' },
        { status: 400 }
      );
    }

    await prisma.watchItem.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting watch item:', error);
    return NextResponse.json(
      { error: 'Failed to delete watch item' },
      { status: 500 }
    );
  }
} 