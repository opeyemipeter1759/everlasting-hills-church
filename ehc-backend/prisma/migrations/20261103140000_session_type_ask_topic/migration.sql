-- Deploy through prisma migrate deploy only.
-- Session types can now:
--   * skip "What would you like to talk about?" (custom sessions keep only the
--     private note), so a request may have no topic;
--   * have their own share link (/talk-to-a-pastor/<host slug>/<slug>),
--     backfilled from the name, with the id appended on a clash;
--   * be archived when deleted after they've been requested, to keep history.
-- Additive apart from relaxing NOT NULL on PastoralBooking.topic.

ALTER TABLE "PastorSessionType" ADD COLUMN IF NOT EXISTS "askTopic" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PastorSessionType" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "PastorSessionType" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "PastoralBooking" ALTER COLUMN "topic" DROP NOT NULL;

UPDATE "PastorSessionType" t
SET "slug" = trim(both '-' from lower(regexp_replace(t."name", '[^a-zA-Z0-9]+', '-', 'g')))
WHERE t."slug" IS NULL;

UPDATE "PastorSessionType" t
SET "slug" = t."slug" || '-' || substr(t."id", 1, 6)
WHERE EXISTS (
  SELECT 1 FROM "PastorSessionType" o
  WHERE o."hostId" = t."hostId" AND o."slug" = t."slug" AND o."id" < t."id"
);

CREATE UNIQUE INDEX IF NOT EXISTS "PastorSessionType_hostId_slug_key" ON "PastorSessionType"("hostId", "slug");

-- The general public page names no pastor: its requests go to one host who
-- assigns them on. Starts as the Super Admin's host, if they've set one up.
ALTER TABLE "PastorHost" ADD COLUMN IF NOT EXISTS "publicIntake" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PastoralBooking" ADD COLUMN IF NOT EXISTS "anonymousIntake" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PastoralBooking" ADD COLUMN IF NOT EXISTS "assignedById" TEXT;
ALTER TABLE "PastoralBooking" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3);

UPDATE "PastorHost" h SET "publicIntake" = true
WHERE h."id" = (
  SELECT ph."id" FROM "PastorHost" ph
  JOIN "RoleGrant" rg ON rg."userId" = ph."profileId" AND rg."tenantId" = ph."tenantId"
  WHERE rg."role" = 'SUPER_ADMIN' AND rg."endedAt" IS NULL
  ORDER BY ph."position" LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM "PastorHost" x WHERE x."publicIntake");

-- Rollback notes (manual):
--   DROP INDEX "PastorSessionType_hostId_slug_key";
--   ALTER TABLE "PastorSessionType" DROP COLUMN "askTopic", DROP COLUMN "slug", DROP COLUMN "archivedAt";
--   ALTER TABLE "PastorHost" DROP COLUMN "publicIntake";
--   ALTER TABLE "PastoralBooking" DROP COLUMN "anonymousIntake", DROP COLUMN "assignedById", DROP COLUMN "assignedAt";
--   (re-adding NOT NULL on topic needs topic-less rows filled in first)
