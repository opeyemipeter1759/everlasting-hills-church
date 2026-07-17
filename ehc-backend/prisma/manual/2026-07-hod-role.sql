-- ─────────────────────────────────────────────────────────────────────────────
-- Head of Department (HOD) role — deterministic create
-- ─────────────────────────────────────────────────────────────────────────────
-- A new role, distinct from Admin Head: a department's Admin Head (or Pastor/
-- Super Admin) appoints one or more HODs under their department; an HOD's own
-- capability is appointing Unit Leads within that department's units.
-- Idempotent — safe to re-run.
--   npx prisma db execute --file prisma/manual/2026-07-hod-role.sql --schema prisma/schema.prisma

-- New role: ranked between HEAD_USHER and ADMIN_HEAD. Holding the role alone
-- grants nothing; scope comes from active DepartmentHod rows.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'HOD' AFTER 'ADMIN_HEAD';

-- ── DepartmentHod (history-preserving; many active HODs per department) ───────
-- Unlike DepartmentHead (one head), a department may have several HODs at once,
-- so there is no "one active per department" unique index — only one active row
-- per (department, user) pair, so the same person can't double-hold the seat.
CREATE TABLE IF NOT EXISTS "DepartmentHod" (
  "id"           TEXT PRIMARY KEY,
  "tenantId"     TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "userId"       TEXT NOT NULL,   -- Profile.id of the HOD
  "assignedById" TEXT,            -- Profile.id of the actor who assigned them
  "assignedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt"      TIMESTAMP(3)     -- null = currently active
);
CREATE INDEX IF NOT EXISTS "DepartmentHod_tenantId_idx" ON "DepartmentHod"("tenantId");
CREATE INDEX IF NOT EXISTS "DepartmentHod_departmentId_idx" ON "DepartmentHod"("departmentId");
CREATE INDEX IF NOT EXISTS "DepartmentHod_userId_idx" ON "DepartmentHod"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "DepartmentHod_one_active_per_dept_user"
  ON "DepartmentHod"("departmentId", "userId") WHERE "endedAt" IS NULL;

-- ── Foreign keys (guarded, Prisma-compatible) ────────────────────────────────
DO $$ BEGIN ALTER TABLE "DepartmentHod" ADD CONSTRAINT "DepartmentHod_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "DepartmentHod" ADD CONSTRAINT "DepartmentHod_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "DepartmentHod" ADD CONSTRAINT "DepartmentHod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "DepartmentHod" ADD CONSTRAINT "DepartmentHod_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── RLS deny-all backstop ────────────────────────────────────────────────────
-- The NestJS API (postgres role, BYPASSRLS) is the enforcement layer. Enabling
-- RLS with no permissive policy denies all anon/authenticated access.
ALTER TABLE "DepartmentHod" ENABLE ROW LEVEL SECURITY;
