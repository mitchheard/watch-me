const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function restoreWatchlistData() {
  try {
    console.log('🔄 Restoring watchlist data...');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'mitchheard@gmail.com' }
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.email}`);
    
    // Create default watchlist if it doesn't exist
    let defaultWatchlist = await prisma.watchlist.findFirst({
      where: {
        ownerId: user.id,
        isDefault: true
      }
    });
    
    if (!defaultWatchlist) {
      defaultWatchlist = await prisma.watchlist.create({
        data: {
          name: 'My Watchlist',
          description: 'Your personal watchlist',
          isDefault: true,
          isShared: false,
          ownerId: user.id
        }
      });
      console.log('✅ Created default watchlist');
    } else {
      console.log('✅ Found existing default watchlist');
    }
    
    // Add the items you mentioned
    const itemsToAdd = [
      { title: 'HIM', type: 'movie', status: 'want-to-watch' },
      { title: 'The Wire', type: 'show', status: 'watching' },
      { title: 'The Expanse', type: 'show', status: 'watching' }
    ];
    
    for (const itemData of itemsToAdd) {
      try {
        // Create WatchlistItem
        const watchlistItem = await prisma.watchlistItem.create({
          data: {
            title: itemData.title,
            type: itemData.type,
            tmdbId: Math.floor(Math.random() * 1000000) // Temporary ID
          }
        });
        
        // Add to watchlist
        await prisma.watchlistItemList.create({
          data: {
            watchlistId: defaultWatchlist.id,
            watchlistItemId: watchlistItem.id,
            status: itemData.status
          }
        });
        
        console.log(`✅ Added: ${itemData.title}`);
      } catch (error) {
        console.error(`❌ Failed to add ${itemData.title}:`, error.message);
      }
    }
    
    console.log('🎉 Watchlist restoration complete!');
    
  } catch (error) {
    console.error('❌ Error restoring data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreWatchlistData();
