import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface WatchItem {
  id: number;
  title: string;
  type: string;
  status: string;
  rating: string | null;
  notes: string | null;
  tmdbOverview: string | null;
  tmdbMovieReleaseYear: number | null;
  tmdbTvFirstAirYear: number | null;
  tmdbMovieRuntime: number | null;
  tmdbTvNumberOfSeasons: number | null;
}

interface Recommendation {
  id: number;
  title: string;
  type: string;
  status: string;
  reason: string;
  confidence: number;
  tmdbPosterPath?: string | null;
  tmdbOverview?: string | null;
  tmdbMovieReleaseYear?: number | null;
  tmdbTvFirstAirYear?: number | null;
  tmdbMovieRuntime?: number | null;
  tmdbTvNumberOfSeasons?: number | null;
}

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
    throw new Error('Not authenticated');
  }
  
  return user.id;
}

async function getOpenAIRecommendations(watchlist: WatchItem[]): Promise<Recommendation[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Prepare watchlist data for AI analysis
  const watchlistSummary = watchlist.map(item => ({
    title: item.title,
    type: item.type,
    status: item.status,
    rating: item.rating,
    notes: item.notes,
    overview: item.tmdbOverview,
    year: item.tmdbMovieReleaseYear || item.tmdbTvFirstAirYear,
    runtime: item.tmdbMovieRuntime,
    seasons: item.tmdbTvNumberOfSeasons
  }));

  const prompt = `Analyze this watchlist and recommend 5 "want-to-watch" items to prioritize:

${watchlistSummary.map(item => `${item.title} (${item.type}, ${item.status})${item.rating ? `, rated: ${item.rating}` : ''}${item.notes ? `, notes: ${item.notes.substring(0, 50)}` : ''}`).join('\n')}

Consider: ratings, content type preferences, themes, time commitment, recency.

Return JSON array:
[{"id": [item_id], "reason": "[2-3 sentence reason]", "confidence": [0.1-1.0]}]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using GPT-4o-mini (formerly GPT-4o-mini) for cost efficiency
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides movie and TV show recommendations. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const aiRecommendations = JSON.parse(content);
    
    // Map AI recommendations back to full watchlist items
    const recommendations: Recommendation[] = aiRecommendations.map((rec: any) => {
      const item = watchlist.find(w => w.id === rec.id);
      if (!item) return null;
      
      return {
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        reason: rec.reason,
        confidence: rec.confidence,
        tmdbPosterPath: item.tmdbPosterPath,
        tmdbOverview: item.tmdbOverview,
        tmdbMovieReleaseYear: item.tmdbMovieReleaseYear,
        tmdbTvFirstAirYear: item.tmdbTvFirstAirYear,
        tmdbMovieRuntime: item.tmdbMovieRuntime,
        tmdbTvNumberOfSeasons: item.tmdbTvNumberOfSeasons,
      };
    }).filter(Boolean);

    return recommendations;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate recommendations');
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    // Get user's watchlist
    const watchlist = await prisma.watchItem.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        rating: true,
        notes: true,
        tmdbOverview: true,
        tmdbMovieReleaseYear: true,
        tmdbTvFirstAirYear: true,
        tmdbMovieRuntime: true,
        tmdbTvNumberOfSeasons: true,
        tmdbPosterPath: true,
        notes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (watchlist.length === 0) {
      return NextResponse.json({ 
        recommendations: [],
        message: 'No items in watchlist to generate recommendations from'
      });
    }

    // Get AI recommendations
    let recommendations: Recommendation[];
    
    try {
      recommendations = await getOpenAIRecommendations(watchlist);
    } catch (error) {
      console.error('OpenAI recommendations failed, using fallback:', error);
      // Fallback: simple recommendation based on want-to-watch items
      const wantToWatchItems = watchlist.filter(item => item.status === 'want-to-watch');
      recommendations = wantToWatchItems.slice(0, 5).map((item, index) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        reason: `This ${item.type} is in your want-to-watch list and could be a great choice for your next viewing.`,
        confidence: 0.8 - (index * 0.1), // Decreasing confidence for each item
        tmdbPosterPath: item.tmdbPosterPath,
        tmdbOverview: item.tmdbOverview,
        tmdbMovieReleaseYear: item.tmdbMovieReleaseYear,
        tmdbTvFirstAirYear: item.tmdbTvFirstAirYear,
        tmdbMovieRuntime: item.tmdbMovieRuntime,
        tmdbTvNumberOfSeasons: item.tmdbTvNumberOfSeasons,
      }));
    }

    return NextResponse.json({
      recommendations,
      totalItems: watchlist.length,
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
