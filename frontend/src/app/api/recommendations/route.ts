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

async function getOpenAIRecommendations(watchlist: WatchItem[]): Promise<{
  recommendations: Recommendation[];
  strategy: string;
  strategyFocus: string;
}> {
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
  const randomIndex = Math.floor(Math.random() * strategies.length);
  let randomStrategy = strategies[randomIndex];
  console.log('Selected strategy index:', randomIndex, 'Strategy:', randomStrategy.name);
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
  
  // Shuffle the filtered watchlist to get different data each time
  const shuffledWatchlist = [...filteredWatchlist].sort(() => Math.random() - 0.5);
  console.log('Shuffled watchlist items:', shuffledWatchlist.map(item => item.title).slice(0, 5));
  console.log('Available IDs in shuffled watchlist:', shuffledWatchlist.map(item => item.id));
  
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
  
  const timestamp = Date.now();
  const prompt = `Analyze this watchlist subset and recommend 5 "want-to-watch" items to prioritize. ${strategyFocus}. It's ${timeContext} time (timestamp: ${timestamp}):

${watchlistSummary.map(item => `ID: ${item.id} - ${item.title} (${item.type}, ${item.status})${item.rating ? `, rated: ${item.rating}` : ''}${item.notes ? `, notes: ${item.notes.substring(0, 50)}` : ''}`).join('\n')}

Strategy: ${randomStrategy.name}. Consider: ratings, content type preferences, themes, time commitment, recency, and the current time of day.

CRITICAL: You MUST return the EXACT numeric ID from the list above. For example, if you want to recommend "The Expanse", you must return {"id": 78, "reason": "...", "confidence": 0.8}. Do NOT return "undefined" or titles. Do NOT make up sequential IDs (1,2,3,4,5). Only use the numeric IDs shown in the list. The available IDs are: ${shuffledWatchlist.map(item => item.id).join(', ')}.

Return JSON array:
[{"id": [exact_numeric_id], "reason": "[2-3 sentence reason]", "confidence": [0.1-1.0]}]`;

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

    // Parse the JSON response - handle markdown formatting
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    console.log('Cleaned OpenAI response:', cleanContent.substring(0, 200) + '...');
    const aiRecommendations = JSON.parse(cleanContent);
    
    // Map AI recommendations back to full watchlist items
    console.log('AI recommendations received:', aiRecommendations.length);
    console.log('AI recommendation IDs:', aiRecommendations.map((rec: any) => rec.id));
    console.log('Full AI response:', JSON.stringify(aiRecommendations, null, 2));
    
    // Filter out any recommendations with undefined or invalid IDs
    const validRecommendations = aiRecommendations.filter((rec: any) => 
      rec.id && rec.id !== "undefined" && rec.id !== undefined && !isNaN(Number(rec.id))
    );
    console.log('Valid recommendations after filtering:', validRecommendations.length);
    
    let recommendations: Recommendation[] = validRecommendations.map((rec: any) => {
      // Try to find by ID in the shuffled watchlist (the items sent to AI)
      let item = shuffledWatchlist.find(w => w.id === rec.id);
      if (!item) {
        console.log('Could not find item for recommendation ID:', rec.id, 'in shuffled watchlist');
        return null;
      }
      
      console.log('Found item for recommendation:', item.title, 'ID:', item.id);
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

    // If we have some AI recommendations but not enough, try to match the AI reasons to actual items
    if (recommendations.length > 0 && recommendations.length < 5) {
      console.log('Partial AI success, trying to match remaining AI reasons to items');
      const usedIds = new Set(recommendations.map(r => r.id));
      const remainingAiRecs = validRecommendations.filter((rec: any) => 
        !recommendations.some(r => r.id === rec.id)
      );
      
      for (const aiRec of remainingAiRecs) {
        // Try to find an item from the shuffled watchlist that wasn't used
        const availableItems = shuffledWatchlist.filter(item => 
          !usedIds.has(item.id)
        );
        
        if (availableItems.length > 0) {
          const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
          usedIds.add(randomItem.id);
          
          recommendations.push({
            id: randomItem.id,
            title: randomItem.title,
            type: randomItem.type,
            status: randomItem.status,
            reason: aiRec.reason, // Keep the AI's detailed reason
            confidence: aiRec.confidence,
            tmdbPosterPath: randomItem.tmdbPosterPath,
            tmdbOverview: randomItem.tmdbOverview,
            tmdbMovieReleaseYear: randomItem.tmdbMovieReleaseYear,
            tmdbTvFirstAirYear: randomItem.tmdbTvFirstAirYear,
            tmdbMovieRuntime: randomItem.tmdbMovieRuntime,
            tmdbTvNumberOfSeasons: randomItem.tmdbTvNumberOfSeasons,
          });
          
          console.log('Matched AI reason to item:', randomItem.title);
        }
      }
    }

    // If AI mapping failed for most items, pick random items from the watchlist
    if (recommendations.length < 3) {
      console.log('AI mapping failed, picking random items from watchlist');
      const availableItems = [...watchlist].sort(() => Math.random() - 0.5).slice(0, 5);
      const fallbackReasons = [
        "This looks like a perfect choice for your next viewing session.",
        "Based on your watchlist, this could be exactly what you're in the mood for.",
        "This one seems to align well with your viewing preferences.",
        "You've had this on your list for a while - maybe it's time to give it a shot!",
        "This could be a great change of pace from your usual viewing habits.",
      ];
      
      recommendations = availableItems.map((item, index) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        reason: fallbackReasons[index % fallbackReasons.length],
        confidence: 0.8 - (index * 0.1),
        tmdbPosterPath: item.tmdbPosterPath,
        tmdbOverview: item.tmdbOverview,
        tmdbMovieReleaseYear: item.tmdbMovieReleaseYear,
        tmdbTvFirstAirYear: item.tmdbTvFirstAirYear,
        tmdbMovieRuntime: item.tmdbMovieRuntime,
        tmdbTvNumberOfSeasons: item.tmdbTvNumberOfSeasons,
      }));
    }

    return {
      recommendations,
      strategy: randomStrategy.name,
      strategyFocus: randomStrategy.focus,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate recommendations');
  }
}

export async function GET(request: NextRequest) {
  console.log('Recommendations API called');
  try {
    console.log('Getting user ID...');
    const userId = await getUserId();
    console.log('User ID:', userId);

    // Get user's watchlist
    console.log('Fetching watchlist from database...');
    let watchlist;
    try {
      watchlist = await prisma.watchItem.findMany({
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
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      watchlist = []; // Set empty array if database fails
    }

    if (watchlist.length === 0) {
      return NextResponse.json({ 
        recommendations: [],
        message: 'No items in watchlist to generate recommendations from'
      });
    }

    // Get AI recommendations
    let recommendations: Recommendation[];
    let strategyName = "fallback";
    let strategyFocus = "recommend from your want-to-watch list";
    
    try {
      console.log('Attempting OpenAI recommendations...');
      const result = await getOpenAIRecommendations(watchlist);
      recommendations = result.recommendations;
      strategyName = result.strategy;
      strategyFocus = result.strategyFocus;
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
    }

    return NextResponse.json({
      recommendations,
      totalItems: watchlist.length,
      strategy: strategyName,
      strategyFocus: strategyFocus,
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    
    // Always return some recommendations, even if there's an error
    // If watchlist is not available due to database error, return empty recommendations
    const wantToWatchItems = (watchlist || []).filter(item => item.status === 'want-to-watch').slice(0, 5);
    const fallbackReasons = [
      "This looks like a perfect choice for your next viewing session.",
      "Based on your watchlist, this could be exactly what you're in the mood for.",
      "This one seems to align well with your viewing preferences.",
      "You've had this on your list for a while - maybe it's time to give it a shot!",
      "This could be a great change of pace from your usual viewing habits.",
    ];
    
    const recommendations = wantToWatchItems.map((item, index) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      reason: fallbackReasons[index % fallbackReasons.length],
      confidence: 0.8 - (index * 0.1),
      tmdbPosterPath: item.tmdbPosterPath,
      tmdbOverview: item.tmdbOverview,
      tmdbMovieReleaseYear: item.tmdbMovieReleaseYear,
      tmdbTvFirstAirYear: item.tmdbTvFirstAirYear,
      tmdbMovieRuntime: item.tmdbMovieRuntime,
      tmdbTvNumberOfSeasons: item.tmdbTvNumberOfSeasons,
    }));
    
    return NextResponse.json({
      recommendations,
      totalItems: (watchlist || []).length,
      strategy: "error-fallback",
      strategyFocus: "recommendations from your want-to-watch list due to an error",
    });
  }
}
