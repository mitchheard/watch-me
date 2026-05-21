-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistMember" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItemList" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "watchlistItemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Want to Watch',
    "rating" TEXT,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchlistItemList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
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

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Watchlist_ownerId_idx" ON "Watchlist"("ownerId");

-- CreateIndex
CREATE INDEX "Watchlist_isShared_idx" ON "Watchlist"("isShared");

-- CreateIndex
CREATE INDEX "WatchlistMember_userId_idx" ON "WatchlistMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistMember_watchlistId_userId_key" ON "WatchlistMember"("watchlistId", "userId");

-- CreateIndex
CREATE INDEX "WatchlistItemList_watchlistId_idx" ON "WatchlistItemList"("watchlistId");

-- CreateIndex
CREATE INDEX "WatchlistItemList_watchlistItemId_idx" ON "WatchlistItemList"("watchlistItemId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItemList_watchlistId_watchlistItemId_key" ON "WatchlistItemList"("watchlistId", "watchlistItemId");

-- CreateIndex
CREATE INDEX "WatchlistItem_type_idx" ON "WatchlistItem"("type");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_tmdbId_key" ON "WatchlistItem"("tmdbId");

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistMember" ADD CONSTRAINT "WatchlistMember_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistMember" ADD CONSTRAINT "WatchlistMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItemList" ADD CONSTRAINT "WatchlistItemList_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItemList" ADD CONSTRAINT "WatchlistItemList_watchlistItemId_fkey" FOREIGN KEY ("watchlistItemId") REFERENCES "WatchlistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
