const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function clearTestData() {
  try {
    console.log('🧹 Clearing test data...');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'mitchheard@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    // Find the default watchlist
    const defaultWatchlist = await prisma.watchlist.findFirst({
      where: {
        ownerId: user.id,
        isDefault: true
      }
    });
    
    if (defaultWatchlist) {
      // Delete all items from the watchlist
      await prisma.watchlistItemList.deleteMany({
        where: { watchlistId: defaultWatchlist.id }
      });
      
      console.log('✅ Cleared items from default watchlist');
      
      // Delete orphaned watchlist items
      await prisma.watchlistItem.deleteMany({
        where: {
          watchlists: {
            none: {}
          }
        }
      });
      
      console.log('✅ Cleaned up orphaned watchlist items');
    }
    
    // Also clear any old WatchItem data
    await prisma.watchItem.deleteMany({
      where: { userId: user.id }
    });
    
    console.log('✅ Cleared old WatchItem data');
    console.log('🎉 Test data cleared! You can now add items through the normal UI.');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestData();
