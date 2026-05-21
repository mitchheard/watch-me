/*
  Warnings:

  - A unique constraint covering the columns `[userId,tmdbId]` on the table `WatchItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "WatchItem_tmdbId_key";

-- CreateIndex
CREATE UNIQUE INDEX "WatchItem_userId_tmdbId_key" ON "WatchItem"("userId", "tmdbId");
