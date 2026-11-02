-- Deploy through prisma migrate deploy only.
-- One-on-One push categories: decisions for the person who requested a
-- session, and new requests for pastors and their delegates. Additive.

ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "pastoralSessionUpdates" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "pastoralRequests" BOOLEAN NOT NULL DEFAULT true;

-- Rollback notes (manual):
--   ALTER TABLE "NotificationPreference" DROP COLUMN "pastoralSessionUpdates", DROP COLUMN "pastoralRequests";
