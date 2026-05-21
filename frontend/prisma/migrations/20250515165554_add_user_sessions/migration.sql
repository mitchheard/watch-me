-- CreateTable
CREATE TABLE "UserSession" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
