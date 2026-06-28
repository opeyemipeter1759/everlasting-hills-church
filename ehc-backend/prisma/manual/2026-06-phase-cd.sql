-- Phase C/D additive schema changes, applied manually to avoid the destructive
-- `prisma db push` (the committed schema.prisma has drifted from the live DB:
-- it is missing AttendanceRecord.checkedInAt, Service.isOpen, Service.serviceType,
-- which db push would otherwise DROP). Everything here is additive and idempotent.

-- Anniversary date for daily anniversary-greeting cron.
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "weddingAnniversary" TIMESTAMP(3);

-- In-app notifications (Phase D).
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        TEXT NOT NULL,
  "tenantId"  TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "type"      TEXT NOT NULL DEFAULT 'general',
  "title"     TEXT NOT NULL,
  "body"      TEXT,
  "link"      TEXT,
  "readAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notification_profileId_readAt_idx"
  ON "Notification" ("profileId", "readAt");

-- Announcements broadcast (Phase D).
CREATE TABLE IF NOT EXISTS "Announcement" (
  "id"          TEXT NOT NULL,
  "tenantId"    TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "body"        TEXT NOT NULL,
  "audience"    TEXT NOT NULL DEFAULT 'all',
  "sendEmail"   BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT,
  "recipients"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Announcement_tenantId_createdAt_idx"
  ON "Announcement" ("tenantId", "createdAt");

-- Foreign keys (guarded so re-running is safe).
DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Announcement"
    ADD CONSTRAINT "Announcement_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
