const { PrismaClient } = require('@prisma/client');

// Use local SQLite database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db"
    }
  }
});

async function checkLocalDatabase() {
  try {
    console.log('Checking local SQLite database...');
    
    // Check for old WatchItem format
    const oldWatchItems = await prisma.watchItem.findMany({
      take: 10
    });
    
    console.log(`Found ${oldWatchItems.length} old WatchItem records in local DB`);
    if (oldWatchItems.length > 0) {
      console.log('Sample old items:');
      oldWatchItems.forEach(item => {
        console.log(`  - ${item.title} (${item.type}) - User: ${item.userId}`);
      });
    }
    
    // Check for users
    const users = await prisma.user.findMany({
      include: {
        WatchItem: true
      }
    });
    
    console.log(`\nFound ${users.length} users in local DB:`);
    users.forEach(user => {
      console.log(`  - ${user.email || user.id}: ${user.WatchItem.length} items`);
    });
    
    // Check total items
    const totalItems = await prisma.watchItem.count();
    console.log(`\nTotal items in local database: ${totalItems}`);
    
  } catch (error) {
    console.error('Error checking local database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocalDatabase();
