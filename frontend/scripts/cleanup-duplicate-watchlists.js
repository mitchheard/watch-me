const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateWatchlists() {
  try {
    console.log('Starting cleanup of duplicate default watchlists...');
    
    // Find users with multiple default watchlists
    const usersWithMultipleDefaults = await prisma.user.findMany({
      where: {
        watchlists: {
          some: { isDefault: true }
        }
      },
      include: {
        watchlists: {
          where: { isDefault: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    for (const user of usersWithMultipleDefaults) {
      if (user.watchlists.length > 1) {
        console.log(`\nProcessing user: ${user.email || user.id}`);
        console.log(`Found ${user.watchlists.length} default watchlists`);
        
        // Keep the first (oldest) default watchlist
        const keepWatchlist = user.watchlists[0];
        const deleteWatchlists = user.watchlists.slice(1);
        
        console.log(`Keeping watchlist: ${keepWatchlist.id} (created: ${keepWatchlist.createdAt})`);
        
        for (const watchlistToDelete of deleteWatchlists) {
          console.log(`Deleting duplicate watchlist: ${watchlistToDelete.id} (created: ${watchlistToDelete.createdAt})`);
          
          // Transfer items from the duplicate to the kept watchlist
          const itemsToTransfer = await prisma.watchlistItemList.findMany({
            where: { watchlistId: watchlistToDelete.id }
          });
          
          if (itemsToTransfer.length > 0) {
            console.log(`Transferring ${itemsToTransfer.length} items`);
            
            for (const item of itemsToTransfer) {
              // Check if item already exists in the kept watchlist
              const existingItem = await prisma.watchlistItemList.findFirst({
                where: {
                  watchlistId: keepWatchlist.id,
                  watchlistItemId: item.watchlistItemId
                }
              });
              
              if (!existingItem) {
                // Transfer the item
                await prisma.watchlistItemList.update({
                  where: { id: item.id },
                  data: { watchlistId: keepWatchlist.id }
                });
              } else {
                // Item already exists, delete the duplicate
                await prisma.watchlistItemList.delete({
                  where: { id: item.id }
                });
              }
            }
          }
          
          // Transfer members from the duplicate to the kept watchlist
          const membersToTransfer = await prisma.watchlistMember.findMany({
            where: { watchlistId: watchlistToDelete.id }
          });
          
          if (membersToTransfer.length > 0) {
            console.log(`Transferring ${membersToTransfer.length} members`);
            
            for (const member of membersToTransfer) {
              // Check if member already exists in the kept watchlist
              const existingMember = await prisma.watchlistMember.findFirst({
                where: {
                  watchlistId: keepWatchlist.id,
                  userId: member.userId
                }
              });
              
              if (!existingMember) {
                // Transfer the member
                await prisma.watchlistMember.update({
                  where: { id: member.id },
                  data: { watchlistId: keepWatchlist.id }
                });
              } else {
                // Member already exists, delete the duplicate
                await prisma.watchlistMember.delete({
                  where: { id: member.id }
                });
              }
            }
          }
          
          // Delete the duplicate watchlist
          await prisma.watchlist.delete({
            where: { id: watchlistToDelete.id }
          });
          
          console.log(`Deleted duplicate watchlist: ${watchlistToDelete.id}`);
        }
      }
    }
    
    console.log('\nCleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateWatchlists();
