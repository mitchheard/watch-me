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
  console.log('OpenAI API key configured:', !!process.env.OPENAI_API_KEY);
  console.log('OpenAI API key length:', process.env.OPENAI_API_KEY?.length || 0);
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Create different recommendation strategies with limited data subsets
  const strategies = [
    {
      name: "recent additions",
      filter: (items: WatchItem[]) => items.filter(item => item.status === 'want-to-watch').slice(0, 10),
      focus: "focus on your most recently added items"
    },
    {
      name: "highly rated similar",
      filter: (items: WatchItem[]) => {
        const finished = items.filter(item => item.status === 'finished' && item.rating === 'loved');
        const wantToWatch = items.filter(item => item.status === 'want-to-watch');
        return wantToWatch.slice(0, 8);
      },
      focus: "prioritize items similar to what you've loved"
    },
    {
      name: "quick wins",
      filter: (items: WatchItem[]) => {
        const movies = items.filter(item => item.status === 'want-to-watch' && item.type === 'movie');
        const shortShows = items.filter(item => item.status === 'want-to-watch' && item.type === 'show' && (item.tmdbTvNumberOfSeasons || 0) <= 2);
        return [...movies, ...shortShows].slice(0, 8);
      },
      focus: "suggest quick, satisfying content you can finish soon"
    },
    {
      name: "deep dives",
      filter: (items: WatchItem[]) => {
        const longShows = items.filter(item => item.status === 'want-to-watch' && item.type === 'show' && (item.tmdbTvNumberOfSeasons || 0) > 2);
        const complexMovies = items.filter(item => item.status === 'want-to-watch' && item.type === 'movie' && (item.tmdbMovieRuntime || 0) > 120);
        return [...longShows, ...complexMovies].slice(0, 8);
      },
      focus: "recommend immersive, longer-form content for deeper engagement"
    },
    {
      name: "mood boosters",
      filter: (items: WatchItem[]) => {
        const wantToWatch = items.filter(item => item.status === 'want-to-watch');
        return wantToWatch.slice(0, 6);
      },
      focus: "suggest uplifting and entertaining content to improve your mood"
    },
    {
      name: "hidden gems",
      filter: (items: WatchItem[]) => {
        const wantToWatch = items.filter(item => item.status === 'want-to-watch');
        // Shuffle and take items that might be less obvious choices
        return wantToWatch.sort(() => Math.random() - 0.5).slice(0, 8);
      },
      focus: "highlight underrated or overlooked content in your list"
    }
  ];

  // Try strategies until we find one with data
  let randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
  let filteredWatchlist = randomStrategy.filter(watchlist);
  
  // If the first strategy returns no data, try others
  if (filteredWatchlist.length === 0) {
    for (const strategy of strategies) {
      const testFilter = strategy.filter(watchlist);
      if (testFilter.length > 0) {
        randomStrategy = strategy;
        filteredWatchlist = testFilter;
        break;
      }
    }
  }
  
  // If still no data, use a simple fallback
  if (filteredWatchlist.length === 0) {
    filteredWatchlist = watchlist.filter(item => item.status === 'want-to-watch').slice(0, 10);
    randomStrategy = {
      name: "fallback",
      focus: "recommend from your want-to-watch list"
    };
  }
  
  console.log('Selected strategy:', randomStrategy.name);
  console.log('Filtered watchlist length:', filteredWatchlist.length);
  
  const shuffledWatchlist = [...filteredWatchlist].sort(() => Math.random() - 0.5);
  
  const watchlistSummary = shuffledWatchlist.map(item => ({
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

  // Use the strategy focus instead of random styles
  const strategyFocus = randomStrategy.focus;
  
  const currentTime = new Date();
  const hour = currentTime.getHours();
  const timeContext = hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
  
  const prompt = `Analyze this watchlist subset and recommend 5 "want-to-watch" items to prioritize. ${strategyFocus}. It's ${timeContext} time:

${watchlistSummary.map(item => `${item.title} (${item.type}, ${item.status})${item.rating ? `, rated: ${item.rating}` : ''}${item.notes ? `, notes: ${item.notes.substring(0, 50)}` : ''}`).join('\n')}

Strategy: ${randomStrategy.name}. Consider: ratings, content type preferences, themes, time commitment, recency, and the current time of day.

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
        temperature: 0.8 + (Math.random() * 0.2), // Random temperature between 0.8-1.0 for more variety
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
    console.log('User ID:', userId);

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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Watchlist items found:', watchlist.length);
    console.log('Watchlist statuses:', watchlist.map(item => item.status));

    if (watchlist.length === 0) {
      return NextResponse.json({ 
        recommendations: [],
        message: 'No items in watchlist to generate recommendations from'
      });
    }

    // Get AI recommendations
    let recommendations: Recommendation[];
    
    try {
      console.log('Attempting OpenAI recommendations...');
      recommendations = await getOpenAIRecommendations(watchlist);
      console.log('OpenAI recommendations successful:', recommendations.length);
    } catch (error) {
      console.error('OpenAI recommendations failed, using fallback:', error);
      // Fallback: simple recommendation based on want-to-watch items with variety
      const wantToWatchItems = watchlist.filter(item => item.status === 'want-to-watch');
      const fallbackReasons = [
        "This looks like a perfect choice for your next viewing session.",
        "Based on your watchlist, this could be exactly what you're in the mood for.",
        "This one seems to align well with your viewing preferences.",
        "You've had this on your list for a while - maybe it's time to give it a shot!",
        "This could be a great change of pace from your usual viewing habits.",
        "Given your ratings on similar content, this might be right up your alley.",
        "This appears to match the kind of content you typically enjoy.",
        "Perfect timing to dive into this one - it looks promising!"
      ];
      
      recommendations = wantToWatchItems.slice(0, 5).map((item, index) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        reason: fallbackReasons[index % fallbackReasons.length],
        confidence: 0.8 - (index * 0.1), // Decreasing confidence for each item
        tmdbPosterPath: item.tmdbPosterPath,
        tmdbOverview: item.tmdbOverview,
        tmdbMovieReleaseYear: item.tmdbMovieReleaseYear,
        tmdbTvFirstAirYear: item.tmdbTvFirstAirYear,
        tmdbMovieRuntime: item.tmdbMovieRuntime,
        tmdbTvNumberOfSeasons: item.tmdbTvNumberOfSeasons,
      }));
      
      // Set fallback strategy for the response
      randomStrategy = {
        name: "fallback",
        focus: "recommend from your want-to-watch list"
      };
    }

    return NextResponse.json({
      recommendations,
      totalItems: watchlist.length,
      strategy: randomStrategy.name,
      strategyFocus: randomStrategy.focus,
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
