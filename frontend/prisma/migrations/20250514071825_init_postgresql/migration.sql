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

    CONSTRAINT "WatchItem_pkey" PRIMARY KEY ("id")
);
