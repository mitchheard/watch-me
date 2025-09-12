const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkOldData() {
  try {
    console.log('Checking for old data formats...');
    
    // Check for old WatchItem format
    const oldWatchItems = await prisma.watchItem.findMany({
      take: 5
    });
    
    console.log(`Found ${oldWatchItems.length} old WatchItem records`);
    if (oldWatchItems.length > 0) {
      console.log('Sample old items:');
      oldWatchItems.forEach(item => {
        console.log(`  - ${item.title} (${item.type}) - User: ${item.userId}`);
      });
    }
    
    // Check for WatchlistItem records
    const watchlistItems = await prisma.watchlistItem.findMany({
      take: 5
    });
    
    console.log(`Found ${watchlistItems.length} WatchlistItem records`);
    if (watchlistItems.length > 0) {
      console.log('Sample watchlist items:');
      watchlistItems.forEach(item => {
        console.log(`  - ${item.title} (${item.type}) - TMDB: ${item.tmdbId}`);
      });
    }
    
    // Check for WatchlistItemList records
    const watchlistItemLists = await prisma.watchlistItemList.findMany({
      take: 5
    });
    
    console.log(`Found ${watchlistItemLists.length} WatchlistItemList records`);
    if (watchlistItemLists.length > 0) {
      console.log('Sample watchlist item lists:');
      watchlistItemLists.forEach(item => {
        console.log(`  - Watchlist: ${item.watchlistId}, Item: ${item.watchlistItemId}`);
      });
    }
    
    // Check all users
    const allUsers = await prisma.user.findMany({
      include: {
        watchlists: true,
        WatchItem: true
      }
    });
    
    console.log(`\nAll users in database:`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email || user.id}: ${user.watchlists.length} watchlists, ${user.WatchItem.length} old items`);
    });
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOldData();
