-- ─────────────────────────────────────────────────────────────────────────────
-- Status Reports: Unit Lead / Department Head reports reviewed by Super Admin
-- ─────────────────────────────────────────────────────────────────────────────
-- A Report is a narrative status update a Unit Lead or Department Head logs
-- about what's going on in their unit/department. A Super Admin reviews it on
-- the Audit Log page: approve, or send back with a correction request via a
-- comment. Comments are flat (no threading), visible to author + reviewers.
-- Idempotent — safe to re-run.
--   npx prisma db execute --file prisma/manual/2026-07-status-reports.sql --schema prisma/schema.prisma

DO $$ BEGIN CREATE TYPE "ReportScope" AS ENUM ('DEPARTMENT', 'UNIT'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ReportStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'NEEDS_CORRECTION'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Report ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Report" (
  "id"             TEXT PRIMARY KEY,
  "tenantId"       TEXT NOT NULL,
  "scope"          "ReportScope" NOT NULL,
  "departmentId"   TEXT,
  "unitId"         TEXT,
  "submittedById"  TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "attachmentUrl"  TEXT,
  "attachmentName" TEXT,
  "status"         "ReportStatus" NOT NULL DEFAULT 'SUBMITTED',
  "reviewedById"   TEXT,
  "reviewedAt"     TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Report_tenantId_status_idx" ON "Report"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Report_departmentId_idx" ON "Report"("departmentId");
CREATE INDEX IF NOT EXISTS "Report_unitId_idx" ON "Report"("unitId");
CREATE INDEX IF NOT EXISTS "Report_submittedById_idx" ON "Report"("submittedById");

-- ── ReportComment ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ReportComment" (
  "id"        TEXT PRIMARY KEY,
  "tenantId"  TEXT NOT NULL,
  "reportId"  TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ReportComment_reportId_idx" ON "ReportComment"("reportId");

-- ── Foreign keys (guarded, Prisma-compatible) ────────────────────────────────
DO $$ BEGIN ALTER TABLE "Report" ADD CONSTRAINT "Report_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Report" ADD CONSTRAINT "Report_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Report" ADD CONSTRAINT "Report_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Report" ADD CONSTRAINT "Report_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Report" ADD CONSTRAINT "Report_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "ReportComment" ADD CONSTRAINT "ReportComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "ReportComment" ADD CONSTRAINT "ReportComment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "ReportComment" ADD CONSTRAINT "ReportComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── RLS deny-all backstop ────────────────────────────────────────────────────
-- The NestJS API (postgres role, BYPASSRLS) is the enforcement layer.
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReportComment" ENABLE ROW LEVEL SECURITY;
