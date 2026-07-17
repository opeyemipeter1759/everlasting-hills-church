-- ─────────────────────────────────────────────────────────────────────────────
-- Follow-Up Pipeline: FollowUpEntry + FollowUpContactLog (deterministic create)
-- ─────────────────────────────────────────────────────────────────────────────
-- `prisma db push` is unreliable against the Supabase transaction pooler. This
-- idempotent SQL creates the new enums, tables, indexes, and foreign keys directly.
--   npx prisma db execute --file prisma/manual/2026-07-follow-up.sql --schema prisma/schema.prisma
-- Safe to re-run.

-- ── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "FollowUpStage" AS ENUM ('UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_REVIEW', 'CONFIRMED', 'REOPENED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "FollowUpSourceType" AS ENUM ('FIRST_TIMER', 'ABSENTEE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "FollowUpOutcome" AS ENUM ('BECAME_MEMBER', 'RETURNED', 'NOT_INTERESTED', 'UNREACHABLE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "FollowUpContactMethod" AS ENUM ('CALL', 'SMS', 'WHATSAPP', 'VISIT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "FollowUpContactOutcome" AS ENUM ('REACHED', 'NO_ANSWER', 'VOICEMAIL', 'WRONG_NUMBER', 'SCHEDULED_VISIT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── FollowUpEntry ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FollowUpEntry" (
  "id"            TEXT PRIMARY KEY,
  "tenantId"      TEXT NOT NULL,
  "unitId"        TEXT NOT NULL,
  "sourceType"    "FollowUpSourceType" NOT NULL,
  "memberId"      TEXT,             -- subject, when sourceType = ABSENTEE
  "visitorId"     TEXT,             -- subject, when sourceType = FIRST_TIMER
  "addedById"     TEXT NOT NULL,    -- Profile.id of the usher/leader who added them
  "assigneeId"    TEXT,             -- Member.id of the team member currently assigned
  "stage"         "FollowUpStage" NOT NULL DEFAULT 'UNASSIGNED',
  "goalContacts"  INTEGER NOT NULL DEFAULT 3,
  "contactCount"  INTEGER NOT NULL DEFAULT 0,
  "lastContactAt" TIMESTAMP(3),
  "outcome"       "FollowUpOutcome",
  "reviewNote"    TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "FollowUpEntry_tenantId_unitId_idx" ON "FollowUpEntry"("tenantId", "unitId");
CREATE INDEX IF NOT EXISTS "FollowUpEntry_tenantId_stage_idx" ON "FollowUpEntry"("tenantId", "stage");
CREATE INDEX IF NOT EXISTS "FollowUpEntry_assigneeId_idx" ON "FollowUpEntry"("assigneeId");

-- ── FollowUpContactLog ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FollowUpContactLog" (
  "id"        TEXT PRIMARY KEY,
  "tenantId"  TEXT NOT NULL,
  "entryId"   TEXT NOT NULL,
  "byId"      TEXT NOT NULL,   -- Member.id who logged it
  "method"    "FollowUpContactMethod" NOT NULL,
  "outcome"   "FollowUpContactOutcome" NOT NULL,
  "note"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "FollowUpContactLog_entryId_idx" ON "FollowUpContactLog"("entryId");
CREATE INDEX IF NOT EXISTS "FollowUpContactLog_tenantId_idx" ON "FollowUpContactLog"("tenantId");

-- ── Foreign keys (guarded, Prisma-compatible) ────────────────────────────────
DO $$ BEGIN ALTER TABLE "FollowUpEntry" ADD CONSTRAINT "FollowUpEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "FollowUpEntry" ADD CONSTRAINT "FollowUpEntry_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "FollowUpEntry" ADD CONSTRAINT "FollowUpEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "FollowUpEntry" ADD CONSTRAINT "FollowUpEntry_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "FollowUpEntry" ADD CONSTRAINT "FollowUpEntry_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "FollowUpEntry" ADD CONSTRAINT "FollowUpEntry_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE "FollowUpContactLog" ADD CONSTRAINT "FollowUpContactLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "FollowUpContactLog" ADD CONSTRAINT "FollowUpContactLog_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "FollowUpEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "FollowUpContactLog" ADD CONSTRAINT "FollowUpContactLog_byId_fkey" FOREIGN KEY ("byId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── RLS deny-all backstop ────────────────────────────────────────────────────
-- The NestJS API (postgres role, BYPASSRLS) is the enforcement layer, scoping
-- every query by tenantId + @Roles + unit/assignee ownership checks. Enabling
-- RLS with no permissive policy denies all anon/authenticated access.
ALTER TABLE "FollowUpEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FollowUpContactLog" ENABLE ROW LEVEL SECURITY;
