const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // Test user table
    const userCount = await prisma.user.count();
    console.log('✅ User table accessible. User count:', userCount);
    
    // Test watchlist table
    const watchlistCount = await prisma.watchItem.count();
    console.log('✅ Watchlist table accessible. Item count:', watchlistCount);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
