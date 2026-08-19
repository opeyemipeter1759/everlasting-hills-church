-- ─────────────────────────────────────────────────────────────────────────────
-- PWA / calendar / push notifications — deterministic create
-- ─────────────────────────────────────────────────────────────────────────────
-- Applied out-of-band. `prisma db push` is NOT used on this project (it has
-- falsely reported "in sync" while applying nothing, and has dropped tables
-- between sessions against the Supabase transaction pooler):
--   npx prisma db execute --file prisma/manual/2026-08-pwa-notifications.sql --schema prisma/schema.prisma
--
-- Column naming follows the rest of this schema: quoted camelCase, no @map.
-- (snake_case "church_id" would be inconsistent with ~60 existing tables, which
-- all use "tenantId".)
--
-- Idempotent: safe to re-run.

-- ── 1. CalendarFeedToken ─────────────────────────────────────────────────────
-- Per-member secret for the .ics subscription feed. The token IS the auth:
-- calendar clients cannot send a bearer header. Therefore: high entropy,
-- revocable, and never guessable. Revoking sets "revokedAt" rather than
-- deleting, so an old URL is provably dead rather than silently recycled.
CREATE TABLE IF NOT EXISTS "CalendarFeedToken" (
  "id"             TEXT NOT NULL,
  "tenantId"       TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "token"          TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt"      TIMESTAMP(3),
  "lastAccessedAt" TIMESTAMP(3),
  CONSTRAINT "CalendarFeedToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CalendarFeedToken_token_key"
  ON "CalendarFeedToken" ("token");
CREATE INDEX IF NOT EXISTS "CalendarFeedToken_tenantId_idx"
  ON "CalendarFeedToken" ("tenantId");
CREATE INDEX IF NOT EXISTS "CalendarFeedToken_userId_idx"
  ON "CalendarFeedToken" ("userId");
-- One live token per member. Partial unique index mirrors the idiom already used
-- by RoleGrant / UnitLeadAssignment / HeadUsherAssignment for "one active row".
CREATE UNIQUE INDEX IF NOT EXISTS "CalendarFeedToken_userId_active_key"
  ON "CalendarFeedToken" ("userId") WHERE "revokedAt" IS NULL;

-- ── 2. PushSubscription ──────────────────────────────────────────────────────
-- One row per browser/device push endpoint. "endpoint" is globally unique — the
-- push service issues it — so re-subscribing the same device upserts instead of
-- duplicating. failedAt/failureCount drive pruning: 404/410 deletes immediately,
-- transient errors increment and are retried.
CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id"           TEXT NOT NULL,
  "tenantId"     TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "endpoint"     TEXT NOT NULL,
  "p256dh"       TEXT NOT NULL,
  "auth"         TEXT NOT NULL,
  "userAgent"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "failedAt"     TIMESTAMP(3),
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key"
  ON "PushSubscription" ("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_tenantId_idx"
  ON "PushSubscription" ("tenantId");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx"
  ON "PushSubscription" ("userId");
-- Dispatch fan-out reads (tenantId, userId) together; this covers it.
CREATE INDEX IF NOT EXISTS "PushSubscription_tenantId_userId_idx"
  ON "PushSubscription" ("tenantId", "userId");

-- ── 3. NotificationPreference ────────────────────────────────────────────────
-- One row per member. Absent row = the defaults below (the dispatcher treats a
-- missing row as "all defaults"), so members are never blocked on a backfill.
--
-- "prayerMeeting" defaults FALSE and is opt-in on purpose: a daily notification
-- is the fastest way to make someone disable notifications entirely.
--
-- quietStart/quietEnd are local wall-clock "HH:MM" interpreted in "timezone",
-- matching the ATTENDANCE_*_OPEN/CLOSE convention already used in env config.
-- A window may wrap midnight (e.g. 22:00 → 06:00); the dispatcher handles that.
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id"                TEXT NOT NULL,
  "tenantId"          TEXT NOT NULL,
  "userId"            TEXT NOT NULL,
  "serviceStarting"   BOOLEAN NOT NULL DEFAULT true,
  "serviceReminder"   BOOLEAN NOT NULL DEFAULT true,
  "servingReminder"   BOOLEAN NOT NULL DEFAULT true,
  "prayerMeeting"     BOOLEAN NOT NULL DEFAULT false,
  "announcements"     BOOLEAN NOT NULL DEFAULT true,
  "unitAnnouncements" BOOLEAN NOT NULL DEFAULT true,
  "newSermon"         BOOLEAN NOT NULL DEFAULT true,
  "milestones"        BOOLEAN NOT NULL DEFAULT true,
  "quietStart"        TEXT,
  "quietEnd"          TEXT,
  "timezone"          TEXT NOT NULL DEFAULT 'Africa/Lagos',
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_key"
  ON "NotificationPreference" ("userId");
CREATE INDEX IF NOT EXISTS "NotificationPreference_tenantId_idx"
  ON "NotificationPreference" ("tenantId");
-- "HH:MM" or nothing. Guards against a bad write reaching the quiet-hours maths.
DO $do$ BEGIN
  ALTER TABLE "NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_quietStart_format_check"
    CHECK ("quietStart" IS NULL OR "quietStart" ~ '^[0-2][0-9]:[0-5][0-9]$');
EXCEPTION WHEN duplicate_object THEN null; END $do$;
DO $do$ BEGIN
  ALTER TABLE "NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_quietEnd_format_check"
    CHECK ("quietEnd" IS NULL OR "quietEnd" ~ '^[0-2][0-9]:[0-5][0-9]$');
EXCEPTION WHEN duplicate_object THEN null; END $do$;

-- ── 4. RecurringGathering ────────────────────────────────────────────────────
-- Admin-managed recurring online gathering (the daily prayer meeting).
-- Nothing in this schema modelled recurrence before this, so there was no
-- existing recurrence model to extend — verified: zero RRULE/recurrence columns.
--
-- DTSTART is split deliberately: "startDate" anchors the RRULE and "startTime"
-- is local wall-clock "HH:MM" in "timezone". Storing a single UTC timestamp
-- would silently shift the meeting whenever the anchor and the occurrence fall
-- on different UTC offsets, which is the classic recurring-event bug.
CREATE TABLE IF NOT EXISTS "RecurringGathering" (
  "id"              TEXT NOT NULL,
  "tenantId"        TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  "description"     TEXT,
  "recurrenceRule"  TEXT NOT NULL,
  "startDate"       DATE NOT NULL,
  "startTime"       TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL DEFAULT 60,
  "timezone"        TEXT NOT NULL DEFAULT 'Africa/Lagos',
  "joinUrl"         TEXT,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecurringGathering_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RecurringGathering_tenantId_isActive_idx"
  ON "RecurringGathering" ("tenantId", "isActive");
DO $do$ BEGIN
  ALTER TABLE "RecurringGathering"
    ADD CONSTRAINT "RecurringGathering_startTime_format_check"
    CHECK ("startTime" ~ '^[0-2][0-9]:[0-5][0-9]$');
EXCEPTION WHEN duplicate_object THEN null; END $do$;
DO $do$ BEGIN
  ALTER TABLE "RecurringGathering"
    ADD CONSTRAINT "RecurringGathering_durationMinutes_check"
    CHECK ("durationMinutes" > 0 AND "durationMinutes" <= 1440);
EXCEPTION WHEN duplicate_object THEN null; END $do$;

-- ── 5. ServiceAssignment ─────────────────────────────────────────────────────
-- Per-service serving roster. NOT in the original brief, but required by it:
-- the brief asks for serving assignments marked distinctly in the calendar feed
-- and a 48h serving reminder, and no per-service roster existed anywhere.
-- (`assignments` is CareAssignment = discipleship; RoleGrant / UnitLeadAssignment
-- / HeadUsherAssignment / DepartmentHead are all standing roles, and nothing
-- linked a Unit or Department to a Service.) Without this table those two
-- requirements have no data source at all.
CREATE TABLE IF NOT EXISTS "ServiceAssignment" (
  "id"           TEXT NOT NULL,
  "tenantId"     TEXT NOT NULL,
  "serviceId"    TEXT NOT NULL,
  "memberId"     TEXT NOT NULL,
  "role"         TEXT NOT NULL,
  "unitId"       TEXT,
  "notes"        TEXT,
  "assignedById" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceAssignment_pkey" PRIMARY KEY ("id")
);
-- A member serves one named role per service; re-assigning the same role upserts.
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceAssignment_serviceId_memberId_role_key"
  ON "ServiceAssignment" ("serviceId", "memberId", "role");
CREATE INDEX IF NOT EXISTS "ServiceAssignment_tenantId_serviceId_idx"
  ON "ServiceAssignment" ("tenantId", "serviceId");
-- Feed + reminder both read "what is THIS member serving at, upcoming".
CREATE INDEX IF NOT EXISTS "ServiceAssignment_tenantId_memberId_idx"
  ON "ServiceAssignment" ("tenantId", "memberId");

-- ── 6. Service: additive columns ─────────────────────────────────────────────
-- Service had no cancellation state and no end time. The brief requires
-- STATUS:CANCELLED in the feed (so subscribers see a cancellation rather than
-- an event silently vanishing) and .ics needs a real DTEND. Both additive.
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER NOT NULL DEFAULT 120;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "location" TEXT;
DO $do$ BEGIN
  ALTER TABLE "Service"
    ADD CONSTRAINT "Service_durationMinutes_check"
    CHECK ("durationMinutes" > 0 AND "durationMinutes" <= 1440);
EXCEPTION WHEN duplicate_object THEN null; END $do$;

-- ── 7. Foreign keys ──────────────────────────────────────────────────────────
-- 87 existing tables carry real FK constraints (Notification and ServiceHeadcount
-- included), so these match convention rather than relying on Prisma-level
-- relations alone. "userId" references Profile.id, consistent with RoleGrant /
-- UnitLeadAssignment / HeadUsherAssignment.
--
-- Referential actions are chosen to match what Prisma infers from the relation
-- declarations in schema.prisma, so `prisma migrate diff` reports no drift:
--   required relation, no onDelete   -> ON DELETE RESTRICT ON UPDATE CASCADE
--   onDelete: Cascade                -> ON DELETE CASCADE  ON UPDATE CASCADE
--   optional relation (unitId)       -> ON DELETE SET NULL ON UPDATE CASCADE
-- Every existing tenantId FK in this database is RESTRICT/CASCADE; matching that
-- keeps tenant rows undeletable while dependent data still exists.
--
-- DROP IF EXISTS + ADD (rather than a DO/EXCEPTION block) so a re-run repairs a
-- constraint that was created with the wrong referential action.
ALTER TABLE "CalendarFeedToken" DROP CONSTRAINT IF EXISTS "CalendarFeedToken_tenantId_fkey";
ALTER TABLE "CalendarFeedToken" ADD CONSTRAINT "CalendarFeedToken_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarFeedToken" DROP CONSTRAINT IF EXISTS "CalendarFeedToken_userId_fkey";
ALTER TABLE "CalendarFeedToken" ADD CONSTRAINT "CalendarFeedToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_tenantId_fkey";
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_userId_fkey";
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationPreference" DROP CONSTRAINT IF EXISTS "NotificationPreference_tenantId_fkey";
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" DROP CONSTRAINT IF EXISTS "NotificationPreference_userId_fkey";
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringGathering" DROP CONSTRAINT IF EXISTS "RecurringGathering_tenantId_fkey";
ALTER TABLE "RecurringGathering" ADD CONSTRAINT "RecurringGathering_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ServiceAssignment" DROP CONSTRAINT IF EXISTS "ServiceAssignment_tenantId_fkey";
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAssignment" DROP CONSTRAINT IF EXISTS "ServiceAssignment_serviceId_fkey";
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceAssignment" DROP CONSTRAINT IF EXISTS "ServiceAssignment_memberId_fkey";
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceAssignment" DROP CONSTRAINT IF EXISTS "ServiceAssignment_unitId_fkey";
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
