// list-watchitems.js
// Usage: node scripts/list-watchitems.js <userId>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = process.argv[2];
  const where = userId ? { userId } : {};
  const items = await prisma.watchItem.findMany({
    where,
    select: {
      id: true,
      title: true,
      tmdbId: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
  if (items.length === 0) {
    console.log('No WatchItems found.');
  } else {
    console.table(items);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 