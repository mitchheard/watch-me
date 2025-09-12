const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('💾 Creating database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Backup watchlists
    const watchlists = await prisma.watchlist.findMany({
      include: {
        owner: true,
        members: {
          include: {
            user: true
          }
        },
        items: {
          include: {
            watchlistItem: true
          }
        }
      }
    });
    
    // Backup watchlist items
    const watchlistItems = await prisma.watchlistItem.findMany();
    
    // Backup users
    const users = await prisma.user.findMany();
    
    const backup = {
      timestamp: new Date().toISOString(),
      watchlists,
      watchlistItems,
      users
    };
    
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    console.log(`📊 Backed up: ${watchlists.length} watchlists, ${watchlistItems.length} items, ${users.length} users`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
