-- Deploy through prisma migrate deploy only.
-- Prayer Watch leaders serve three months. Records when the current term
-- ends and whether the admins have been told it is over. Additive.
-- Leaders already in place have no recorded start, so their term starts now.

ALTER TABLE "PrayerSlot" ADD COLUMN IF NOT EXISTS "leaderTermEndsAt" TIMESTAMP(3);
ALTER TABLE "PrayerSlot" ADD COLUMN IF NOT EXISTS "leaderTermEndNotifiedAt" TIMESTAMP(3);

UPDATE "PrayerSlot" SET "leaderTermEndsAt" = now() + interval '3 months'
WHERE "leaderId" IS NOT NULL AND "leaderTermEndsAt" IS NULL;

-- Rollback notes (manual):
--   ALTER TABLE "PrayerSlot" DROP COLUMN "leaderTermEndsAt", DROP COLUMN "leaderTermEndNotifiedAt";
