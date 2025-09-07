#!/usr/bin/env node

/**
 * Script to update existing default watchlist names from "My Personal List" to "My Watchlist"
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateDefaultWatchlistNames() {
  console.log('🔄 Updating default watchlist names...');
  
  try {
    // Find all watchlists with the old name
    const watchlistsToUpdate = await prisma.watchlist.findMany({
      where: {
        name: 'My Personal List',
        isDefault: true
      }
    });

    console.log(`📊 Found ${watchlistsToUpdate.length} watchlists to update`);

    if (watchlistsToUpdate.length === 0) {
      console.log('✅ No watchlists need updating');
      return;
    }

    // Update each watchlist
    for (const watchlist of watchlistsToUpdate) {
      await prisma.watchlist.update({
        where: { id: watchlist.id },
        data: { name: 'My Watchlist' }
      });
      console.log(`✅ Updated watchlist for user: ${watchlist.ownerId}`);
    }

    console.log('\n🎉 All default watchlist names updated successfully!');

  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateDefaultWatchlistNames()
  .catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  });
