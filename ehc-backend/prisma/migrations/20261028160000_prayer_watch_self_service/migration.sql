-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN     "prayerWatchReminder" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "PrayerSignup" ADD COLUMN     "profileId" TEXT;

-- CreateTable
CREATE TABLE "PrayerWatchReflection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "signupId" TEXT NOT NULL,
    "profileId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrayerWatchReflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrayerWatchReflection_signupId_key" ON "PrayerWatchReflection"("signupId");

-- CreateIndex
CREATE INDEX "PrayerSignup_profileId_idx" ON "PrayerSignup"("profileId");

-- AddForeignKey
ALTER TABLE "PrayerWatchReflection" ADD CONSTRAINT "PrayerWatchReflection_signupId_fkey" FOREIGN KEY ("signupId") REFERENCES "PrayerSignup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
