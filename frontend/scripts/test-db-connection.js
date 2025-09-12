const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test user query
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Test watchlist query
    const watchlistCount = await prisma.watchlist.count();
    console.log(`✅ Found ${watchlistCount} watchlists in database`);
    
    // Test specific user
    const testUser = await prisma.user.findFirst({
      where: { email: 'mitchheard@gmail.com' },
      include: {
        watchlists: true
      }
    });
    
    if (testUser) {
      console.log(`✅ Found user: ${testUser.email}`);
      console.log(`✅ User has ${testUser.watchlists.length} watchlists`);
      testUser.watchlists.forEach(wl => {
        console.log(`  - ${wl.name} (${wl.isDefault ? 'default' : 'custom'})`);
      });
    } else {
      console.log('❌ User mitchheard@gmail.com not found');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
