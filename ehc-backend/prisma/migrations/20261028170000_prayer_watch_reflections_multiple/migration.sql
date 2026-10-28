-- DropIndex
DROP INDEX "PrayerWatchReflection_signupId_key";

-- AlterTable
ALTER TABLE "PrayerWatchReflection" DROP COLUMN "updatedAt";

-- CreateIndex
CREATE INDEX "PrayerWatchReflection_signupId_createdAt_idx" ON "PrayerWatchReflection"("signupId", "createdAt");
