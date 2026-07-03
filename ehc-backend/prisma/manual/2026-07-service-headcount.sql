-- ─────────────────────────────────────────────────────────────────────────────
-- Usher headcount — deterministic create + HEAD_USHER role
-- ─────────────────────────────────────────────────────────────────────────────
-- `prisma db push` is unreliable against the Supabase transaction pooler (it has
-- falsely reported "in sync" while applying nothing, and has dropped tables
-- between sessions). This idempotent SQL creates the headcount table and adds the
-- new role enum value directly.
--   npx prisma db execute --file prisma/manual/2026-07-service-headcount.sql --schema prisma/schema.prisma
-- Safe to re-run.

-- New role: a head usher can record congregation headcounts without full admin
-- rights. Ranked between UNIT_LEAD and ADMIN in the app's role hierarchy.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'HEAD_USHER' BEFORE 'UNIT_LEAD';

DO $$ BEGIN
  CREATE TYPE "HeadcountStatus" AS ENUM ('DRAFT', 'CONFIRMED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "ServiceHeadcount" (
  "id"            TEXT PRIMARY KEY,
  "tenantId"      TEXT NOT NULL,
  "serviceId"     TEXT NOT NULL,
  "recordedBy"    TEXT,
  "men"           INTEGER NOT NULL DEFAULT 0,
  "women"         INTEGER NOT NULL DEFAULT 0,
  "boys"          INTEGER NOT NULL DEFAULT 0,
  "girls"         INTEGER NOT NULL DEFAULT 0,
  "firstTimers"   INTEGER NOT NULL DEFAULT 0,
  "total"         INTEGER NOT NULL DEFAULT 0,
  "reportedTotal" INTEGER,
  "notes"         TEXT,
  "status"        "HeadcountStatus" NOT NULL DEFAULT 'DRAFT',
  "recordedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceHeadcount_nonneg_chk" CHECK ("men">=0 AND "women">=0 AND "boys">=0 AND "girls">=0 AND "firstTimers">=0 AND ("reportedTotal" IS NULL OR "reportedTotal">=0)),
  CONSTRAINT "ServiceHeadcount_total_chk"  CHECK ("total" = "men"+"women"+"boys"+"girls"),
  CONSTRAINT "ServiceHeadcount_ft_chk"     CHECK ("firstTimers" <= "total")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ServiceHeadcount_serviceId_key" ON "ServiceHeadcount"("serviceId");
CREATE INDEX IF NOT EXISTS "ServiceHeadcount_tenantId_status_idx" ON "ServiceHeadcount"("tenantId", "status");

-- Foreign keys (guarded — Prisma-compatible)
DO $$ BEGIN ALTER TABLE "ServiceHeadcount" ADD CONSTRAINT "ServiceHeadcount_tenantId_fkey"  FOREIGN KEY ("tenantId")  REFERENCES "Tenant"("id")  ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "ServiceHeadcount" ADD CONSTRAINT "ServiceHeadcount_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS backstop: deny-all to non-BYPASSRLS roles. The NestJS API (postgres role,
-- BYPASSRLS) is the enforcement layer, scoping every query by tenantId + @Roles.
-- No permissive policy until the RLS-primary (JWT tenant claim) migration lands.
-- See prisma/manual/2026-07-cms-rls.sql for the full rationale.
ALTER TABLE "ServiceHeadcount" ENABLE ROW LEVEL SECURITY;
