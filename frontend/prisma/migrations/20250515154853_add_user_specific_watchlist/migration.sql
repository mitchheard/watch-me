/*
  Warnings:

  - Made the column `userId` on table `WatchItem` required. This step will fail if there are existing NULL values in that column.

*/
-- Delete existing items since they're test data
DELETE FROM "WatchItem";

-- AlterTable
ALTER TABLE "WatchItem" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "WatchItem_userId_idx" ON "WatchItem"("userId");
