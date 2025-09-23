import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Simple in-memory cache (in production, use Redis or similar)
const recommendationCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds (much shorter cache)

interface WatchItem {
  id: number;
  title: string;
  type: string;
  status: string;
  rating: string | null;
  notes?: string | null;
  tmdbPosterPath: string | null;
  tmdbOverview: string | null;
  tmdbMovieReleaseYear: number | null;
  tmdbTvFirstAirYear: number | null;
  tmdbMovieRuntime: number | null;
  tmdbTvNumberOfSeasons: number | null;
  createdAt?: Date | null;
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
  createdAt?: string | null;
}

interface AIRecommendation {
  id: number;
  title: string;
  reason: string;
  confidence: number;
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

  // Create different recommendation strategies with limited data subsets (optimized for speed)
  const strategies = [
    {
      name: "recent additions",
      filter: (items: WatchItem[]) => items.filter(item => item.status === 'want-to-watch').slice(0, 8),
      focus: "focus on your most recently added items"
    },
    {
      name: "highly rated similar",
      filter: (items: WatchItem[]) => {
        const wantToWatch = items.filter(item => item.status === 'want-to-watch');
        return wantToWatch.slice(0, 6);
      },
      focus: "prioritize items similar to what you've loved"
    },
    {
      name: "quick wins",
      filter: (items: WatchItem[]) => {
        const movies = items.filter(item => item.status === 'want-to-watch' && item.type === 'movie');
        const shortShows = items.filter(item => item.status === 'want-to-watch' && item.type === 'show' && (item.tmdbTvNumberOfSeasons || 0) <= 2);
        return [...movies, ...shortShows].slice(0, 6);
      },
      focus: "suggest quick, satisfying content you can finish soon"
    },
    {
      name: "deep dives",
      filter: (items: WatchItem[]) => {
        const longShows = items.filter(item => item.status === 'want-to-watch' && item.type === 'show' && (item.tmdbTvNumberOfSeasons || 0) > 2);
        const complexMovies = items.filter(item => item.status === 'want-to-watch' && item.type === 'movie' && (item.tmdbMovieRuntime || 0) > 120);
        return [...longShows, ...complexMovies].slice(0, 6);
      },
      focus: "recommend immersive, longer-form content for deeper engagement"
    },
    {
      name: "mood boosters",
      filter: (items: WatchItem[]) => {
        const wantToWatch = items.filter(item => item.status === 'want-to-watch');
        return wantToWatch.slice(0, 5);
      },
      focus: "suggest uplifting and entertaining content to improve your mood"
    },
    {
      name: "hidden gems",
      filter: (items: WatchItem[]) => {
        const wantToWatch = items.filter(item => item.status === 'want-to-watch');
        // Shuffle and take items that might be less obvious choices
        return wantToWatch.sort(() => Math.random() - 0.5).slice(0, 6);
      },
      focus: "highlight underrated or overlooked content in your list"
    },
    {
      name: "continue watching",
      filter: (items: WatchItem[]) => {
        // Find shows that are "watching" status (in progress)
        const inProgressShows = items.filter(item => 
          item.status === 'watching' && 
          item.type === 'show' && 
          item.tmdbTvNumberOfSeasons && 
          item.tmdbTvNumberOfSeasons > 1
        );
        
        // Also include shows that are "finished" but have more seasons available
        const finishedWithMoreSeasons = items.filter(item => 
          item.status === 'finished' && 
          item.type === 'show' && 
          item.tmdbTvNumberOfSeasons && 
          item.tmdbTvNumberOfSeasons > 1
        );
        
        return [...inProgressShows, ...finishedWithMoreSeasons].slice(0, 6);
      },
      focus: "suggest shows you've started or finished that have more seasons to continue"
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
      filter: (items: WatchItem[]) => items.filter(item => item.status === 'want-to-watch').slice(0, 10),
      focus: "recommend from your want-to-watch list"
    };
  }
  
  console.log('Selected strategy:', randomStrategy.name);
  console.log('Filtered watchlist length:', filteredWatchlist.length);
  
  // Shuffle the filtered watchlist to get different data each time
  const shuffledWatchlist = [...filteredWatchlist].sort(() => Math.random() - 0.5);
  console.log('Shuffled watchlist items:', shuffledWatchlist.map(item => item.title).slice(0, 5));
  console.log('Available IDs in shuffled watchlist:', shuffledWatchlist.map(item => item.id));
  
  // Optimized watchlist summary - only essential data for faster processing
  const watchlistSummary = shuffledWatchlist.map(item => ({
    id: item.id,
    title: item.title,
    type: item.type,
    rating: item.rating,
    year: item.tmdbMovieReleaseYear || item.tmdbTvFirstAirYear,
    seasons: item.tmdbTvNumberOfSeasons
  }));

  const strategyFocus = randomStrategy.focus;
  const currentTime = new Date();
  const hour = currentTime.getHours();
  const timeContext = hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
  
  // const timestamp = Date.now(); // Removed unused variable
  // Create a more detailed user profile for better recommendations
  const userProfile = {
    preferences: {
      genres: [...new Set(shuffledWatchlist.map(item => {
        // Simple genre inference from titles and years
        if (item.title.toLowerCase().includes('horror') || item.title.toLowerCase().includes('scary')) return 'Horror';
        if (item.title.toLowerCase().includes('comedy') || item.title.toLowerCase().includes('funny')) return 'Comedy';
        if (item.title.toLowerCase().includes('drama') || item.title.toLowerCase().includes('serious')) return 'Drama';
        if (item.year && item.year > 2020) return 'Recent Releases';
        if (item.year && item.year < 2000) return 'Classic Films';
        return 'General';
      }))],
      types: [...new Set(shuffledWatchlist.map(item => item.type))],
      ratings: shuffledWatchlist.filter(item => item.rating).map(item => item.rating)
    },
    recentActivity: shuffledWatchlist.slice(0, 5).map(item => ({
      title: item.title,
      type: item.type,
      rating: item.rating
    }))
  };

  const prompt = `You are a personalized movie and TV recommendation expert. Analyze this user's watchlist and provide compelling, specific reasons for your recommendations.

USER PROFILE:
- Recent additions: ${userProfile.recentActivity.map(item => `${item.title} (${item.type})${item.rating ? ` - rated ${item.rating}` : ''}`).join(', ')}
- Preferred content types: ${userProfile.preferences.types.join(', ')}
- Time of day: ${timeContext}
- Strategy focus: ${strategyFocus}

WATCHLIST (pick 5 from these):
${watchlistSummary.map(item => `${item.id}: ${item.title} (${item.type})${item.rating ? `, ${item.rating}` : ''}${item.year ? `, ${item.year}` : ''}${item.seasons ? `, ${item.seasons}s` : ''}`).join('\n')}

REQUIREMENTS:
- Write compelling, specific reasons that reference the user's actual preferences
- Mention specific aspects like genre, tone, themes, or what makes it perfect for them
- NEVER use these generic phrases: "looks good", "might enjoy", "perfect choice", "exactly what you're in the mood for", "this looks like a perfect choice", "based on your watchlist", "this one seems to align well"
- Make each reason feel personalized and thoughtful
- Reference their recent activity or preferences when relevant
- Be specific about WHY this particular item matches their taste
- Use concrete details about the content, not vague statements
- Mention specific genres, themes, or unique aspects of the content

EXAMPLES OF GOOD REASONS:
- "Given your interest in psychological thrillers like [recent item], this crime drama's complex character development will keep you engaged"
- "Since you've been exploring [genre] recently, this [specific aspect] will appeal to your current viewing mood"
- "This [specific element] aligns perfectly with your preference for [specific preference]"

EXAMPLES OF BAD REASONS (DO NOT USE):
- "This looks like a perfect choice for your next viewing session"
- "Based on your watchlist, this could be exactly what you're in the mood for"
- "This one seems to align well with your viewing preferences"

Return: [{"id": [exact_id], "title": "[exact_title]", "reason": "[compelling 2-3 sentence personalized reason]", "confidence": [0.1-1.0]}]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective model
        messages: [
          {
            role: 'system',
            content: 'You are a personalized movie and TV recommendation expert. Always respond with valid JSON. Write compelling, specific reasons that avoid generic phrases. Reference the user\'s actual preferences and be concrete about why each recommendation matches their taste. NEVER use phrases like "perfect choice", "exactly what you\'re in the mood for", "looks good", or "might enjoy". Be specific about genres, themes, or what makes it unique.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7, // Slightly lower for more consistent, faster responses
        max_tokens: 500, // Further reduced for faster response
        top_p: 0.9, // Add top_p for faster generation
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
    console.log('AI recommendation IDs:', aiRecommendations.map((rec: AIRecommendation) => rec.id));
    console.log('Full AI response:', JSON.stringify(aiRecommendations, null, 2));
    
    // Filter out any recommendations with undefined or invalid IDs
    let validRecommendations = aiRecommendations.filter((rec: AIRecommendation) => 
      rec.id && rec.id !== undefined && !isNaN(Number(rec.id))
    );
    
    // Additional validation: ensure the AI's title matches an item in our shuffled watchlist
    validRecommendations = validRecommendations.filter((rec: AIRecommendation) => {
      if (!rec.title) return false;
      
      const matchingItem = shuffledWatchlist.find(item => 
        item.title.toLowerCase() === rec.title.toLowerCase()
      );
      
      if (!matchingItem) {
        console.log('❌ AI title does not match any item:', rec.title);
        return false;
      }
      
      // Also verify the ID matches the title
      if (matchingItem.id !== rec.id) {
        console.log('❌ AI ID and title mismatch:', rec.id, 'vs', matchingItem.id, 'for title:', rec.title);
        return false;
      }
      
      return true;
    });
    console.log('Valid recommendations after filtering:', validRecommendations.length);
    
    console.log('=== MAPPING DEBUG ===');
    console.log('Shuffled watchlist items and IDs:');
    shuffledWatchlist.forEach(item => {
      console.log(`  ID ${item.id}: ${item.title}`);
    });
    console.log('AI recommendations to map:');
    validRecommendations.forEach((rec: AIRecommendation) => {
      console.log(`  AI wants ID ${rec.id}: "${rec.reason.substring(0, 50)}..."`);
    });
    
    let recommendations: Recommendation[] = validRecommendations.map((rec: AIRecommendation) => {
      // Try to find by ID in the shuffled watchlist (the items sent to AI)
      let item = shuffledWatchlist.find(w => w.id === rec.id);
      
      // If not found by ID, try to find by title (case-insensitive)
      if (!item && rec.title) {
        item = shuffledWatchlist.find(w => w.title.toLowerCase() === rec.title.toLowerCase());
        if (item) {
          console.log('⚠️  Found item by title instead of ID:', item.title, 'ID:', item.id);
        }
      }
      
      if (!item) {
        console.log('❌ Could not find item for recommendation ID:', rec.id, 'Title:', rec.title, 'in shuffled watchlist');
        return null;
      }
      
      console.log('✅ Found item for recommendation:', item.title, 'ID:', item.id, 'AI Title:', rec.title);
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
        createdAt: item.createdAt?.toISOString(),
      };
    }).filter(Boolean);

    // If we have some AI recommendations but not enough, try to match the AI reasons to actual items
    if (recommendations.length > 0 && recommendations.length < 5) {
      console.log('Partial AI success, trying to match remaining AI reasons to items');
      const usedIds = new Set(recommendations.map(r => r.id));
      const remainingAiRecs = validRecommendations.filter((rec: AIRecommendation) => 
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
            createdAt: randomItem.createdAt?.toISOString(),
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
  let watchlist: WatchItem[] = [];
  
  try {
    console.log('Getting user ID...');
    const userId = await getUserId();
    console.log('User ID:', userId);

    // Check for cache busting parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // Check cache first (unless force refresh is requested)
    const cacheKey = `recommendations_${userId}`;
    const cached = recommendationCache.get(cacheKey);
    if (!forceRefresh && cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('Returning cached recommendations');
      return NextResponse.json(cached.data);
    }

    // Get user's watchlist from new schema
    console.log('Fetching watchlist from database...');
    try {
      // First, get the user's default watchlist
      const defaultWatchlist = await prisma.watchlist.findFirst({
        where: {
          ownerId: userId,
          isDefault: true,
        },
      });

      if (!defaultWatchlist) {
        console.log('No default watchlist found for user');
        watchlist = [];
      } else {
        // Get items from the default watchlist (optimized for AI processing)
        const watchlistItems = await prisma.watchlistItemList.findMany({
          where: {
            watchlistId: defaultWatchlist.id,
            status: 'want-to-watch', // Only get want-to-watch items for recommendations
          },
          include: {
            watchlistItem: {
              select: {
                id: true,
                title: true,
                type: true,
                tmdbPosterPath: true,
                tmdbMovieReleaseYear: true,
                tmdbTvFirstAirYear: true,
                tmdbTvNumberOfSeasons: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            addedAt: 'desc',
          },
          take: 20, // Reduced to 20 items for faster AI processing
        });

        // Transform to the expected format (optimized)
        watchlist = watchlistItems.map(item => ({
          id: item.watchlistItem.id,
          title: item.watchlistItem.title,
          type: item.watchlistItem.type,
          status: item.status,
          rating: item.rating,
          tmdbPosterPath: item.watchlistItem.tmdbPosterPath,
          tmdbMovieReleaseYear: item.watchlistItem.tmdbMovieReleaseYear,
          tmdbTvFirstAirYear: item.watchlistItem.tmdbTvFirstAirYear,
          tmdbTvNumberOfSeasons: item.watchlistItem.tmdbTvNumberOfSeasons,
          createdAt: item.watchlistItem.createdAt,
        }));
      }

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
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
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

    const responseData = {
      recommendations,
      totalItems: watchlist.length,
      strategy: strategyName,
      strategyFocus: strategyFocus,
    };

    // Cache the results
    recommendationCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    return NextResponse.json(responseData);

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
