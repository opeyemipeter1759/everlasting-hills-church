-- Deploy through prisma migrate deploy only.
-- New admin/staff-facing push category: a Prayer Watch sign-up is waiting on
-- approval. Plain additive column, no enum involved, safe in one file.

ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "prayerWatchPendingApproval" BOOLEAN NOT NULL DEFAULT true;

-- Rollback notes (manual, only if this migration must be undone):
--   ALTER TABLE "NotificationPreference" DROP COLUMN "prayerWatchPendingApproval";
