-- Deploy through prisma migrate deploy only.
-- Every Prayer Watch sign-up now starts PENDING and waits for an admin to
-- approve it, the same way a Prayer Watchmen Family change request already
-- does — previously a sign-up was CONFIRMED the instant it was submitted.
-- Also adds the single Telegram channel every approved watcher is given,
-- shared across every slot, and who/when a sign-up was decided.

ALTER TYPE "PrayerSignupStatus" ADD VALUE IF NOT EXISTS 'PENDING';

ALTER TABLE "PrayerSignup" ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "PrayerSignup" ADD COLUMN IF NOT EXISTS "decidedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "decidedById" TEXT;

ALTER TABLE "PrayerWatch" ADD COLUMN IF NOT EXISTS "telegramLink" TEXT;

-- Rollback notes (manual, only if this migration must be undone):
--   ALTER TABLE "PrayerWatch" DROP COLUMN "telegramLink";
--   ALTER TABLE "PrayerSignup" DROP COLUMN "decidedAt", DROP COLUMN "decidedById";
--   ALTER TABLE "PrayerSignup" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
--   (PENDING cannot be removed from the enum without recreating the type — leaving
--    the value unused is harmless if this migration must be reverted)
