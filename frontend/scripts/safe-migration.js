const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function safeMigration() {
  try {
    console.log('🛡️  Starting safe migration process...');
    
    // 1. Create backup before any migration
    console.log('📦 Creating pre-migration backup...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Backup all data
    const watchlists = await prisma.watchlist.findMany({
      include: {
        owner: true,
        members: { include: { user: true } },
        items: { include: { watchlistItem: true } }
      }
    });
    
    const watchlistItems = await prisma.watchlistItem.findMany();
    const users = await prisma.user.findMany();
    const oldWatchItems = await prisma.watchItem.findMany();
    
    const backup = {
      timestamp: new Date().toISOString(),
      watchlists,
      watchlistItems,
      users,
      oldWatchItems
    };
    
    const backupFile = path.join(backupDir, `pre-migration-backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Pre-migration backup created: ${backupFile}`);
    console.log(`📊 Data counts: ${watchlists.length} watchlists, ${watchlistItems.length} items, ${users.length} users, ${oldWatchItems.length} old items`);
    
    // 2. Check for data integrity
    console.log('🔍 Checking data integrity...');
    
    if (watchlists.length === 0 && oldWatchItems.length > 0) {
      console.log('⚠️  WARNING: No watchlists found but old items exist. Data migration may be needed.');
    }
    
    if (users.length === 0) {
      console.log('❌ ERROR: No users found. This is a critical issue.');
      return;
    }
    
    console.log('✅ Data integrity check passed');
    
    // 3. Create recovery instructions
    const recoveryInstructions = `
# Database Recovery Instructions

## Backup Created: ${timestamp}
- Watchlists: ${watchlists.length}
- Watchlist Items: ${watchlistItems.length}
- Users: ${users.length}
- Old WatchItems: ${oldWatchItems.length}

## To Restore Data:
1. Run: node scripts/restore-from-backup.js ${backupFile}
2. Or manually restore from the JSON file

## Prevention:
- Always run this script before migrations
- Keep backups in the backups/ directory
- Test migrations on staging first
`;
    
    const instructionsFile = path.join(backupDir, `recovery-instructions-${timestamp}.md`);
    fs.writeFileSync(instructionsFile, recoveryInstructions);
    
    console.log(`📋 Recovery instructions saved: ${instructionsFile}`);
    console.log('🎉 Safe migration process complete!');
    
  } catch (error) {
    console.error('❌ Safe migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

safeMigration();
