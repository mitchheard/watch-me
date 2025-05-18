import { TMDB } from 'tmdb-ts';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB API key is not configured.' }, { status: 500 });
  }

  // The tmdb-ts library's constructor expects the API key (v3) or access token (v4).
  // For v3, it's just the key.
  const tmdb = new TMDB(apiKey);

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
  }

  try {
    // Use multi-search to get movies and TV shows, which includes `media_type`
    const results = await tmdb.search.multi({ query });

    // The search.multi endpoint returns results that can include movies, TV shows, and people.
    // The frontend already filters for media_type 'movie' or 'tv', so we can send the raw results.

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching TMDB:', error);
    let errorMessage = 'Failed to fetch data from TMDB.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Check if the error is from tmdb-ts and has more specific details
    // e.g. if (error.status_message) errorMessage = error.status_message;
    return NextResponse.json({ error: 'Failed to search TMDB.', details: errorMessage }, { status: 500 });
  }
} 