const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function cleanupOldWatchItems() {
  try {
    console.log('🧹 Cleaning up old WatchItem records...');
    
    // Find all users
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.email}`);
      
      // Find their default watchlist
      const defaultWatchlist = await prisma.watchlist.findFirst({
        where: {
          ownerId: user.id,
          isDefault: true
        }
      });
      
      if (!defaultWatchlist) {
        console.log('  ⚠️  No default watchlist found, skipping');
        continue;
      }
      
      // Check if they have old WatchItem records
      const oldItems = await prisma.watchItem.findMany({
        where: { userId: user.id }
      });
      
      if (oldItems.length === 0) {
        console.log('  ✅ No old WatchItem records found');
        continue;
      }
      
      console.log(`  📦 Found ${oldItems.length} old WatchItem records`);
      
      // Migrate each old item to the new system
      for (const oldItem of oldItems) {
        // Check if this item already exists in the new system
        const existingWatchlistItem = await prisma.watchlistItem.findUnique({
          where: { tmdbId: oldItem.tmdbId || 0 }
        });
        
        let watchlistItem;
        if (existingWatchlistItem) {
          watchlistItem = existingWatchlistItem;
        } else {
          // Create new WatchlistItem
          watchlistItem = await prisma.watchlistItem.create({
            data: {
              tmdbId: oldItem.tmdbId || 0,
              title: oldItem.title,
              type: oldItem.type,
              tmdbImdbId: oldItem.tmdbImdbId,
              tmdbMovieCertification: oldItem.tmdbMovieCertification,
              tmdbMovieReleaseYear: oldItem.tmdbMovieReleaseYear,
              tmdbMovieRuntime: oldItem.tmdbMovieRuntime,
              tmdbOverview: oldItem.tmdbOverview,
              tmdbPosterPath: oldItem.tmdbPosterPath,
              tmdbTagline: oldItem.tmdbTagline,
              tmdbTvCertification: oldItem.tmdbTvCertification,
              tmdbTvFirstAirYear: oldItem.tmdbTvFirstAirYear,
              tmdbTvLastAirYear: oldItem.tmdbTvLastAirYear,
              tmdbTvNetworks: oldItem.tmdbTvNetworks,
              tmdbTvNumberOfEpisodes: oldItem.tmdbTvNumberOfEpisodes,
              tmdbTvNumberOfSeasons: oldItem.tmdbTvNumberOfSeasons,
              tmdbTvStatus: oldItem.tmdbTvStatus,
            }
          });
        }
        
        // Check if this item is already in the user's watchlist
        const existingWatchlistItemList = await prisma.watchlistItemList.findFirst({
          where: {
            watchlistId: defaultWatchlist.id,
            watchlistItemId: watchlistItem.id
          }
        });
        
        if (!existingWatchlistItemList) {
          // Add to user's default watchlist
          await prisma.watchlistItemList.create({
            data: {
              watchlistId: defaultWatchlist.id,
              watchlistItemId: watchlistItem.id,
              status: oldItem.status,
              rating: oldItem.rating,
              notes: oldItem.notes,
              addedAt: oldItem.createdAt,
              updatedAt: oldItem.updatedAt
            }
          });
          console.log(`  ➕ Migrated: ${oldItem.title}`);
        } else {
          console.log(`  ⚠️  Already exists: ${oldItem.title}`);
        }
      }
      
      // Delete old WatchItem records
      await prisma.watchItem.deleteMany({
        where: { userId: user.id }
      });
      
      console.log(`  🗑️  Deleted ${oldItems.length} old WatchItem records`);
    }
    
    console.log('\n🎉 Cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldWatchItems();
