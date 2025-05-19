// delete-orphaned-tmdb.js
// Usage: node scripts/delete-orphaned-tmdb.js <tmdbId>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tmdbId = parseInt(process.argv[2], 10);
  if (!tmdbId) {
    console.error('Usage: node scripts/delete-orphaned-tmdb.js <tmdbId>');
    process.exit(1);
  }
  const deleted = await prisma.watchItem.deleteMany({ where: { tmdbId } });
  console.log(`Deleted ${deleted.count} orphaned WatchItem(s) with tmdbId=${tmdbId}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 