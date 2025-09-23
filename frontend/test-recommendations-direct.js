const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRecommendationsDirect() {
  try {
    console.log('Testing recommendations logic directly...');
    
    // Use the same user ID from our previous test
    const userId = '464661fa-7ae1-406f-9975-dec0ccbc94aa';
    console.log('Using user ID:', userId);
    
    // Test the exact same query as the API
    const defaultWatchlist = await prisma.watchlist.findFirst({
      where: {
        ownerId: userId,
        isDefault: true,
      },
    });

    if (!defaultWatchlist) {
      console.log('No default watchlist found for user');
      return;
    }

    console.log('Default watchlist found:', defaultWatchlist.name);

    // Get items from the default watchlist
    const watchlistItems = await prisma.watchlistItemList.findMany({
      where: {
        watchlistId: defaultWatchlist.id,
      },
      include: {
        watchlistItem: {
          select: {
            id: true,
            title: true,
            type: true,
            tmdbOverview: true,
            tmdbMovieReleaseYear: true,
            tmdbTvFirstAirYear: true,
            tmdbMovieRuntime: true,
            tmdbTvNumberOfSeasons: true,
            tmdbPosterPath: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
      take: 50,
    });

    // Transform to the expected format
    const watchlist = watchlistItems.map(item => ({
      id: item.watchlistItem.id,
      title: item.watchlistItem.title,
      type: item.watchlistItem.type,
      status: item.status,
      rating: item.rating,
      tmdbOverview: item.watchlistItem.tmdbOverview,
      tmdbMovieReleaseYear: item.watchlistItem.tmdbMovieReleaseYear,
      tmdbTvFirstAirYear: item.watchlistItem.tmdbTvFirstAirYear,
      tmdbMovieRuntime: item.watchlistItem.tmdbMovieRuntime,
      tmdbTvNumberOfSeasons: item.watchlistItem.tmdbTvNumberOfSeasons,
      tmdbPosterPath: item.watchlistItem.tmdbPosterPath,
      createdAt: item.watchlistItem.createdAt,
    }));

    console.log('Watchlist items found:', watchlist.length);
    console.log('Watchlist statuses:', watchlist.map(item => item.status));
    
    // Test the recommendation logic
    const wantToWatchItems = watchlist.filter(item => item.status === 'want-to-watch');
    console.log('Want to watch items:', wantToWatchItems.length);
    
    if (wantToWatchItems.length > 0) {
      console.log('Sample want-to-watch items:');
      wantToWatchItems.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} (${item.type})`);
      });
    }
    
  } catch (error) {
    console.error('Error testing recommendations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRecommendationsDirect();
