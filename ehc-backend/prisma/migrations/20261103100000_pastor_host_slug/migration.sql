-- Deploy through prisma migrate deploy only.
-- One-on-One share links: each pastor gets a slug for /talk-to-a-pastor/<slug>,
-- plus an optional standing Google Meet or Zoom link for online sessions.
-- Additive. Existing hosts are backfilled from their display name, with the
-- row id appended if two names would collide.

ALTER TABLE "PastorHost" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "PastorHost" ADD COLUMN IF NOT EXISTS "defaultMeetingLink" TEXT;

UPDATE "PastorHost" h
SET "slug" = trim(both '-' from lower(regexp_replace(h."displayName", '[^a-zA-Z0-9]+', '-', 'g')))
WHERE h."slug" IS NULL;

UPDATE "PastorHost" h
SET "slug" = h."slug" || '-' || substr(h."id", 1, 6)
WHERE EXISTS (
  SELECT 1 FROM "PastorHost" o
  WHERE o."tenantId" = h."tenantId" AND o."slug" = h."slug" AND o."id" < h."id"
);

CREATE UNIQUE INDEX IF NOT EXISTS "PastorHost_tenantId_slug_key" ON "PastorHost"("tenantId", "slug");

-- Rollback notes (manual):
--   DROP INDEX "PastorHost_tenantId_slug_key";
--   ALTER TABLE "PastorHost" DROP COLUMN "slug", DROP COLUMN "defaultMeetingLink";
