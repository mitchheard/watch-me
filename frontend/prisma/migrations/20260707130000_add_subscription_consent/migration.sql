-- CreateTable
CREATE TABLE "SubscriptionConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "termsText" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SubscriptionConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionConsent_userId_idx" ON "SubscriptionConsent"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionConsent_consentedAt_idx" ON "SubscriptionConsent"("consentedAt");

-- AddForeignKey
ALTER TABLE "SubscriptionConsent" ADD CONSTRAINT "SubscriptionConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
