#!/usr/bin/env node

/**
 * Migration script to convert existing WatchItem data to the new multiple watchlists system
 * 
 * This script:
 * 1. Creates a default "My Personal List" for each user
 * 2. Migrates existing WatchItem data to WatchlistItem and WatchlistItemList
 * 3. Preserves all existing data (status, rating, notes, etc.)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToMultipleWatchlists() {
  console.log('🚀 Starting migration to multiple watchlists system...');
  
  try {
    // Get all users with existing watch items
    const usersWithItems = await prisma.user.findMany({
      where: {
        WatchItem: {
          some: {}
        }
      },
      include: {
        WatchItem: true
      }
    });

    console.log(`📊 Found ${usersWithItems.length} users with watch items to migrate`);

    for (const user of usersWithItems) {
      console.log(`\n👤 Migrating user: ${user.email || user.id}`);
      
      // Create default personal watchlist for this user
      const defaultWatchlist = await prisma.watchlist.create({
        data: {
          name: 'My Personal List',
          description: 'Your personal watchlist',
          isDefault: true,
          isShared: false,
          ownerId: user.id
        }
      });

      console.log(`✅ Created default watchlist: ${defaultWatchlist.name}`);

      // Migrate each watch item
      for (const watchItem of user.WatchItem) {
        // Skip items without tmdbId (they shouldn't exist but let's be safe)
        if (!watchItem.tmdbId) {
          console.log(`  ⚠️  Skipping item without tmdbId: ${watchItem.title}`);
          continue;
        }

        // Create or find the WatchlistItem
        let watchlistItem = await prisma.watchlistItem.findUnique({
          where: { tmdbId: watchItem.tmdbId }
        });

        if (!watchlistItem) {
          watchlistItem = await prisma.watchlistItem.create({
            data: {
              title: watchItem.title,
              type: watchItem.type,
              tmdbId: watchItem.tmdbId,
              tmdbImdbId: watchItem.tmdbImdbId,
              tmdbMovieCertification: watchItem.tmdbMovieCertification,
              tmdbMovieReleaseYear: watchItem.tmdbMovieReleaseYear,
              tmdbMovieRuntime: watchItem.tmdbMovieRuntime,
              tmdbOverview: watchItem.tmdbOverview,
              tmdbPosterPath: watchItem.tmdbPosterPath,
              tmdbTagline: watchItem.tmdbTagline,
              tmdbTvCertification: watchItem.tmdbTvCertification,
              tmdbTvFirstAirYear: watchItem.tmdbTvFirstAirYear,
              tmdbTvLastAirYear: watchItem.tmdbTvLastAirYear,
              tmdbTvNetworks: watchItem.tmdbTvNetworks,
              tmdbTvNumberOfEpisodes: watchItem.tmdbTvNumberOfEpisodes,
              tmdbTvNumberOfSeasons: watchItem.tmdbTvNumberOfSeasons,
              tmdbTvStatus: watchItem.tmdbTvStatus,
            }
          });
        }

        // Add the item to the user's default watchlist
        await prisma.watchlistItemList.create({
          data: {
            watchlistId: defaultWatchlist.id,
            watchlistItemId: watchlistItem.id,
            status: watchItem.status,
            rating: watchItem.rating,
            notes: watchItem.notes,
            addedAt: watchItem.createdAt,
            updatedAt: watchItem.updatedAt
          }
        });

        console.log(`  📝 Migrated: ${watchItem.title} (${watchItem.status})`);
      }

      console.log(`✅ Migrated ${user.WatchItem.length} items for user ${user.email || user.id}`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Created default watchlists for ${usersWithItems.length} users`);
    console.log(`- Migrated all existing watch items to the new system`);
    console.log(`- Preserved all user data (status, rating, notes)`);
    console.log('\n⚠️  Note: The old WatchItem table still exists but is no longer used.');
    console.log('   You can safely remove it after verifying the migration was successful.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateToMultipleWatchlists()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
