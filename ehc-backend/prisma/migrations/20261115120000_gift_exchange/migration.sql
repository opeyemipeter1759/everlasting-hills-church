-- Deploy through prisma migrate deploy only.
-- Gift exchange: a member shows interest with one tap; admins can reject an
-- entry. New enum and table only; nothing existing changes.

CREATE TYPE "GiftEntryStatus" AS ENUM ('INTERESTED', 'REJECTED');

CREATE TABLE "GiftExchangeEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "GiftEntryStatus" NOT NULL DEFAULT 'INTERESTED',
    "rejectionReason" VARCHAR(300),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GiftExchangeEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GiftExchangeEntry_memberId_key" ON "GiftExchangeEntry"("memberId");
CREATE INDEX "GiftExchangeEntry_tenantId_status_idx" ON "GiftExchangeEntry"("tenantId", "status");

ALTER TABLE "GiftExchangeEntry" ADD CONSTRAINT "GiftExchangeEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GiftExchangeEntry" ADD CONSTRAINT "GiftExchangeEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
