-- ─────────────────────────────────────────────────────────────────────────────
-- Follow-Up Pipeline v2: pastor escalation, connection matching, per-service
-- leader reports, unified timeline (quick updates + private notes), snooze.
-- ─────────────────────────────────────────────────────────────────────────────
-- `prisma db push` is unreliable against the Supabase transaction pooler. This
-- idempotent SQL creates the new enums, tables, columns, indexes, and foreign
-- keys directly.
--   npx prisma db execute --file prisma/manual/2026-08-follow-up-v2.sql --schema prisma/schema.prisma
-- Safe to re-run.

-- ── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "FollowUpLogKind" AS ENUM ('CONTACT', 'QUICK_UPDATE', 'CONNECTION', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "FollowUpConnectionStatus" AS ENUM ('SUGGESTED', 'INTRODUCED', 'CONNECTED', 'DECLINED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "FollowUpReportSentVia" AS ENUM ('EMAIL', 'WHATSAPP', 'BOTH');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── FollowUpEntry: pastor escalation + snooze ──────────────────────────────
ALTER TABLE "FollowUpEntry" ADD COLUMN IF NOT EXISTS "sentToPastorById" TEXT;
ALTER TABLE "FollowUpEntry" ADD COLUMN IF NOT EXISTS "sentToPastorAt" TIMESTAMP(3);
ALTER TABLE "FollowUpEntry" ADD COLUMN IF NOT EXISTS "snoozedUntil" TIMESTAMP(3);

DO $$ BEGIN
  ALTER TABLE "FollowUpEntry" ADD CONSTRAINT "FollowUpEntry_sentToPastorById_fkey"
    FOREIGN KEY ("sentToPastorById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── FollowUpContactLog: unified timeline (quick updates, private notes) ────
ALTER TABLE "FollowUpContactLog" ALTER COLUMN "method" DROP NOT NULL;
ALTER TABLE "FollowUpContactLog" ALTER COLUMN "outcome" DROP NOT NULL;
ALTER TABLE "FollowUpContactLog" ADD COLUMN IF NOT EXISTS "kind" "FollowUpLogKind" NOT NULL DEFAULT 'CONTACT';
ALTER TABLE "FollowUpContactLog" ADD COLUMN IF NOT EXISTS "isPastoralContact" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FollowUpContactLog" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- ── Visitor: connection-matching consent ───────────────────────────────────
ALTER TABLE "Visitor" ADD COLUMN IF NOT EXISTS "shareForConnections" BOOLEAN NOT NULL DEFAULT false;

-- ── FollowUpConnection ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FollowUpConnection" (
  "id"                TEXT PRIMARY KEY,
  "tenantId"          TEXT NOT NULL,
  "entryId"           TEXT NOT NULL,
  "suggestedMemberId" TEXT NOT NULL,
  "matchReason"       TEXT NOT NULL,
  "sharedAttributes"  TEXT[] NOT NULL DEFAULT '{}',
  "status"            "FollowUpConnectionStatus" NOT NULL DEFAULT 'SUGGESTED',
  "introducedById"    TEXT,
  "introducedAt"      TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "FollowUpConnection_entryId_suggestedMemberId_key" ON "FollowUpConnection"("entryId", "suggestedMemberId");
CREATE INDEX IF NOT EXISTS "FollowUpConnection_entryId_idx" ON "FollowUpConnection"("entryId");
CREATE INDEX IF NOT EXISTS "FollowUpConnection_tenantId_idx" ON "FollowUpConnection"("tenantId");

DO $$ BEGIN ALTER TABLE "FollowUpConnection" ADD CONSTRAINT "FollowUpConnection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "FollowUpConnection" ADD CONSTRAINT "FollowUpConnection_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "FollowUpEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "FollowUpConnection" ADD CONSTRAINT "FollowUpConnection_suggestedMemberId_fkey" FOREIGN KEY ("suggestedMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "FollowUpConnection" ADD CONSTRAINT "FollowUpConnection_introducedById_fkey" FOREIGN KEY ("introducedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── ServiceFollowUpReport ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ServiceFollowUpReport" (
  "id"           TEXT PRIMARY KEY,
  "tenantId"     TEXT NOT NULL,
  "serviceId"    TEXT NOT NULL,
  "unitId"       TEXT NOT NULL,
  "compiledById" TEXT NOT NULL,
  "summaryText"  TEXT NOT NULL,
  "stats"        JSONB NOT NULL,
  "sentVia"      "FollowUpReportSentVia",
  "sentAt"       TIMESTAMP(3),
  "entryIds"     TEXT[] NOT NULL DEFAULT '{}',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceFollowUpReport_tenantId_serviceId_unitId_key" ON "ServiceFollowUpReport"("tenantId", "serviceId", "unitId");
CREATE INDEX IF NOT EXISTS "ServiceFollowUpReport_tenantId_unitId_idx" ON "ServiceFollowUpReport"("tenantId", "unitId");

DO $$ BEGIN ALTER TABLE "ServiceFollowUpReport" ADD CONSTRAINT "ServiceFollowUpReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "ServiceFollowUpReport" ADD CONSTRAINT "ServiceFollowUpReport_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "ServiceFollowUpReport" ADD CONSTRAINT "ServiceFollowUpReport_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "ServiceFollowUpReport" ADD CONSTRAINT "ServiceFollowUpReport_compiledById_fkey" FOREIGN KEY ("compiledById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── RLS deny-all backstop ────────────────────────────────────────────────────
-- The NestJS API (postgres role, BYPASSRLS) is the enforcement layer.
ALTER TABLE "FollowUpConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceFollowUpReport" ENABLE ROW LEVEL SECURITY;
