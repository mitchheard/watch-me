-- Watch Me Pro / AVIDX-107: additive Stripe subscription fields only (no drops).
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN "subscriptionPeriodEnd" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
