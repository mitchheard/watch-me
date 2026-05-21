/*
  Warnings:

  - A unique constraint covering the columns `[tmdbId]` on the table `WatchItem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WatchItem" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "tmdbId" INTEGER,
ADD COLUMN     "tmdbImdbId" TEXT,
ADD COLUMN     "tmdbMovieCertification" TEXT,
ADD COLUMN     "tmdbMovieReleaseYear" INTEGER,
ADD COLUMN     "tmdbMovieRuntime" INTEGER,
ADD COLUMN     "tmdbOverview" TEXT,
ADD COLUMN     "tmdbPosterPath" TEXT,
ADD COLUMN     "tmdbTagline" TEXT,
ADD COLUMN     "tmdbTvCertification" TEXT,
ADD COLUMN     "tmdbTvFirstAirYear" INTEGER,
ADD COLUMN     "tmdbTvLastAirYear" INTEGER,
ADD COLUMN     "tmdbTvNetworks" TEXT,
ADD COLUMN     "tmdbTvNumberOfEpisodes" INTEGER,
ADD COLUMN     "tmdbTvNumberOfSeasons" INTEGER,
ADD COLUMN     "tmdbTvStatus" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WatchItem_tmdbId_key" ON "WatchItem"("tmdbId");

-- AddForeignKey
ALTER TABLE "WatchItem" ADD CONSTRAINT "WatchItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
