-- Deploy through prisma migrate deploy only.
-- Prayer Watch nightly reports: each watch leader records that their watch
-- was kept, when it ran, how many prayed, and the handover to the next watch.
-- New table only; nothing existing changes.

-- CreateTable
CREATE TABLE "PrayerWatchReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "nightDate" DATE NOT NULL,
    "reportedById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "minutesPrayed" INTEGER NOT NULL,
    "peoplePresent" INTEGER NOT NULL,
    "handedOver" BOOLEAN NOT NULL,
    "handedOverTo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerWatchReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrayerWatchReport_tenantId_nightDate_idx" ON "PrayerWatchReport"("tenantId", "nightDate");

-- CreateIndex
CREATE UNIQUE INDEX "PrayerWatchReport_slotId_nightDate_key" ON "PrayerWatchReport"("slotId", "nightDate");

-- AddForeignKey
ALTER TABLE "PrayerWatchReport" ADD CONSTRAINT "PrayerWatchReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerWatchReport" ADD CONSTRAINT "PrayerWatchReport_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "PrayerSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Rollback notes (manual): DROP TABLE "PrayerWatchReport";
