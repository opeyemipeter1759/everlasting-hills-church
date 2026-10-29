-- Deploy through prisma migrate deploy only.
-- A declined sign-up now gets its own status (previously reused REMOVED,
-- which made a decline indistinguishable from an admin later pulling a
-- confirmed sign-up off the roster) plus a persisted reason, so admins can
-- track past declines instead of just the fact that one happened. No SQL
-- here uses the new enum value, so — unlike 20261029130000/20261029140000,
-- which hit exactly this Postgres restriction for PENDING — it's safe to add
-- the column in the same migration as the enum value.

ALTER TYPE "PrayerSignupStatus" ADD VALUE IF NOT EXISTS 'DECLINED';

ALTER TABLE "PrayerSignup" ADD COLUMN IF NOT EXISTS "decisionNote" TEXT;

-- Rollback notes (manual, only if this migration must be undone):
--   ALTER TABLE "PrayerSignup" DROP COLUMN "decisionNote";
--   (DECLINED cannot be removed from the enum without recreating the type —
--    leaving the value unused is harmless if this migration must be reverted)
