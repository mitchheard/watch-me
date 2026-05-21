/*
  Warnings:

  - You are about to drop the `WatchItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('movie', 'show');

-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('watching', 'completed', 'plan_to_watch', 'dropped');

-- Rename the old table to preserve data
ALTER TABLE "WatchItem" RENAME TO "watch_items_old";

-- Create the new table
CREATE TABLE "watch_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "status" "WatchStatus" NOT NULL,
    "currentSeason" INTEGER,
    "totalSeasons" INTEGER,
    "notes" TEXT,
    "rating" INTEGER,
    "tmdbId" INTEGER UNIQUE,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "watch_items_pkey" PRIMARY KEY ("id")
);

-- Copy data from old table to new table
INSERT INTO "watch_items" (
    "id", "title", "type", "status", "currentSeason", "totalSeasons", 
    "notes", "rating", "tmdbId", "tmdbImdbId", "tmdbMovieCertification",
    "tmdbMovieReleaseYear", "tmdbMovieRuntime", "tmdbOverview", "tmdbPosterPath",
    "tmdbTagline", "tmdbTvCertification", "tmdbTvFirstAirYear", "tmdbTvLastAirYear",
    "tmdbTvNetworks", "tmdbTvNumberOfEpisodes", "tmdbTvNumberOfSeasons", "tmdbTvStatus",
    "createdAt", "updatedAt", "userId"
)
SELECT 
    "id", "title", 
    CASE 
        WHEN "type" = 'movie' THEN 'movie'::"MediaType"
        ELSE 'show'::"MediaType"
    END as "type",
    CASE 
        WHEN "status" = 'watching' THEN 'watching'::"WatchStatus"
        WHEN "status" = 'completed' THEN 'completed'::"WatchStatus"
        WHEN "status" = 'plan_to_watch' THEN 'plan_to_watch'::"WatchStatus"
        ELSE 'dropped'::"WatchStatus"
    END as "status",
    "currentSeason", "totalSeasons", 
    "notes", "rating", "tmdbId", "tmdbImdbId", "tmdbMovieCertification",
    "tmdbMovieReleaseYear", "tmdbMovieRuntime", "tmdbOverview", "tmdbPosterPath",
    "tmdbTagline", "tmdbTvCertification", "tmdbTvFirstAirYear", "tmdbTvLastAirYear",
    "tmdbTvNetworks", "tmdbTvNumberOfEpisodes", "tmdbTvNumberOfSeasons", "tmdbTvStatus",
    "createdAt", "updatedAt", "userId"
FROM "watch_items_old";

-- Drop the old table
DROP TABLE "watch_items_old";

-- Add foreign key constraint
ALTER TABLE "watch_items" ADD CONSTRAINT "watch_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
