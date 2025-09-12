const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateUsers() {
  try {
    console.log('Starting cleanup of duplicate users...');
    
    // Find users with duplicate emails
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count
      FROM "User"
      WHERE email IS NOT NULL
      GROUP BY email
      HAVING COUNT(*) > 1
    `;
    
    console.log('Found duplicate emails:', duplicateEmails);
    
    for (const duplicate of duplicateEmails) {
      const users = await prisma.user.findMany({
        where: { email: duplicate.email },
        include: {
          watchlists: true,
          watchlistMembers: true,
          WatchItem: true
        },
        orderBy: { createdAt: 'asc' } // Keep the oldest user
      });
      
      if (users.length > 1) {
        const keepUser = users[0]; // Keep the first (oldest) user
        const deleteUsers = users.slice(1); // Delete the rest
        
        console.log(`Processing email: ${duplicate.email}`);
        console.log(`Keeping user: ${keepUser.id} (created: ${keepUser.createdAt})`);
        
        for (const userToDelete of deleteUsers) {
          console.log(`Deleting user: ${userToDelete.id} (created: ${userToDelete.createdAt})`);
          
          // Transfer watchlists to the kept user
          if (userToDelete.watchlists.length > 0) {
            await prisma.watchlist.updateMany({
              where: { ownerId: userToDelete.id },
              data: { ownerId: keepUser.id }
            });
            console.log(`Transferred ${userToDelete.watchlists.length} watchlists`);
          }
          
          // Transfer watchlist memberships
          if (userToDelete.watchlistMembers.length > 0) {
            await prisma.watchlistMember.updateMany({
              where: { userId: userToDelete.id },
              data: { userId: keepUser.id }
            });
            console.log(`Transferred ${userToDelete.watchlistMembers.length} watchlist memberships`);
          }
          
          // Transfer watch items
          if (userToDelete.WatchItem.length > 0) {
            await prisma.watchItem.updateMany({
              where: { userId: userToDelete.id },
              data: { userId: keepUser.id }
            });
            console.log(`Transferred ${userToDelete.WatchItem.length} watch items`);
          }
          
          // Delete the duplicate user
          await prisma.user.delete({
            where: { id: userToDelete.id }
          });
          
          console.log(`Deleted duplicate user: ${userToDelete.id}`);
        }
      }
    }
    
    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateUsers();
