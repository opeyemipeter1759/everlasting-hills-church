-- CreateEnum
CREATE TYPE "PrayerFamilyChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "PrayerFamilyChangeRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "signupId" TEXT NOT NULL,
    "toSlotId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "PrayerFamilyChangeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,

    CONSTRAINT "PrayerFamilyChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrayerFamilyChangeRequest_tenantId_status_idx" ON "PrayerFamilyChangeRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PrayerFamilyChangeRequest_signupId_status_idx" ON "PrayerFamilyChangeRequest"("signupId", "status");

-- AddForeignKey
ALTER TABLE "PrayerFamilyChangeRequest" ADD CONSTRAINT "PrayerFamilyChangeRequest_signupId_fkey" FOREIGN KEY ("signupId") REFERENCES "PrayerSignup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerFamilyChangeRequest" ADD CONSTRAINT "PrayerFamilyChangeRequest_toSlotId_fkey" FOREIGN KEY ("toSlotId") REFERENCES "PrayerSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
