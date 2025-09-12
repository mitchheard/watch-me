const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

// Try with SSL disabled
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?sslmode=disable'
    }
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing database connection with SSL disabled...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic connection successful:', result);
    
  } catch (error) {
    console.error('❌ Database connection failed with SSL disabled:');
    console.error('Error message:', error.message);
    
    // Try with SSL required
    console.log('\nTrying with SSL required...');
    const prismaSSL = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?sslmode=require'
        }
      },
      log: ['query', 'info', 'warn', 'error'],
    });
    
    try {
      const resultSSL = await prismaSSL.$queryRaw`SELECT 1 as test`;
      console.log('✅ Basic connection successful with SSL required:', resultSSL);
    } catch (errorSSL) {
      console.error('❌ Database connection failed with SSL required:');
      console.error('Error message:', errorSSL.message);
    } finally {
      await prismaSSL.$disconnect();
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
