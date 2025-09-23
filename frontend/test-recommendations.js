const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRecommendations() {
  try {
    console.log('Testing recommendations database queries...');
    
    // Test 1: Check if we have any users
    const users = await prisma.user.findMany({
      take: 5,
      select: { id: true, email: true }
    });
    console.log('Users found:', users.length);
    console.log('User IDs:', users.map(u => u.id));
    
    if (users.length === 0) {
      console.log('No users found in database');
      return;
    }
    
    const userId = users[0].id;
    console.log('Testing with user ID:', userId);
    
    // Test 2: Check if user has a default watchlist
    const defaultWatchlist = await prisma.watchlist.findFirst({
      where: {
        ownerId: userId,
        isDefault: true,
      },
    });
    
    console.log('Default watchlist found:', !!defaultWatchlist);
    if (defaultWatchlist) {
      console.log('Default watchlist ID:', defaultWatchlist.id);
      console.log('Default watchlist name:', defaultWatchlist.name);
    }
    
    // Test 3: Check watchlist items
    if (defaultWatchlist) {
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
            },
          },
        },
        take: 10,
      });
      
      console.log('Watchlist items found:', watchlistItems.length);
      watchlistItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.watchlistItem.title} (${item.watchlistItem.type}) - Status: ${item.status}`);
      });
    }
    
    // Test 4: Check old watchItem table
    const oldWatchItems = await prisma.watchItem.findMany({
      where: {
        userId: userId,
      },
      take: 5,
    });
    
    console.log('Old watchItem entries found:', oldWatchItems.length);
    oldWatchItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} (${item.type}) - Status: ${item.status}`);
    });
    
  } catch (error) {
    console.error('Error testing recommendations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRecommendations();
