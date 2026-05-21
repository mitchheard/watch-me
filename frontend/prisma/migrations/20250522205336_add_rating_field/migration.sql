/*
  Warnings:

  - You are about to drop the `watch_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "watch_items" DROP CONSTRAINT "watch_items_userId_fkey";

-- DropTable
DROP TABLE "watch_items";

-- DropEnum
DROP TYPE "MediaType";

-- DropEnum
DROP TYPE "WatchStatus";

-- CreateTable
CREATE TABLE "WatchItem" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentSeason" INTEGER,
    "totalSeasons" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "rating" INTEGER,
    "tmdbId" INTEGER,
    "tmdbImdbId" TEXT,
    "tmdbMovieCertification" TEXT,
    "tmdbMovieReleaseYear" INTEGER,
    "tmdbMovieRuntime" INTEGER,
    "tmdbOverview" TEXT,
    "tmdbPosterPath" TEXT,
    "tmdbTagline" TEXT,
    "tmdbTvCertification" TEXT,
    "tmdbTvFirstAirYear" INTEGER,
    "tmdbTvLastAirYear" INTEGER,
    "tmdbTvNetworks" TEXT,
    "tmdbTvNumberOfEpisodes" INTEGER,
    "tmdbTvNumberOfSeasons" INTEGER,
    "tmdbTvStatus" TEXT,

    CONSTRAINT "WatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchItem_tmdbId_key" ON "WatchItem"("tmdbId");

-- CreateIndex
CREATE INDEX "WatchItem_userId_idx" ON "WatchItem"("userId");

-- AddForeignKey
ALTER TABLE "WatchItem" ADD CONSTRAINT "WatchItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
