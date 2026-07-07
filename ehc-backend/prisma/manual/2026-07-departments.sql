-- ─────────────────────────────────────────────────────────────────────────────
-- Administrative Departments + Admin Head layer (deterministic create)
-- ─────────────────────────────────────────────────────────────────────────────
-- `prisma db push` is unreliable against the Supabase transaction pooler. This
-- idempotent SQL creates the department tables, the new role value, and the
-- Unit.departmentId column directly.
--   npx prisma db execute --file prisma/manual/2026-07-departments.sql --schema prisma/schema.prisma
-- Safe to re-run.

-- New role: an Admin Head oversees one or more departments. Ranked between
-- HEAD_USHER and ADMIN. Holding the role alone grants nothing; scope comes from
-- active DepartmentHead rows.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN_HEAD' BEFORE 'HEAD_USHER';

-- ── Department ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Department" (
  "id"          TEXT PRIMARY KEY,
  "tenantId"    TEXT NOT NULL,
  "code"        TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Department_tenantId_code_key" ON "Department"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "Department_tenantId_idx" ON "Department"("tenantId");

-- ── DepartmentHead (history-preserving; one active head per department) ───────
CREATE TABLE IF NOT EXISTS "DepartmentHead" (
  "id"           TEXT PRIMARY KEY,
  "tenantId"     TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "userId"       TEXT NOT NULL,   -- Profile.id of the head
  "assignedById" TEXT,            -- Profile.id of the actor who assigned them
  "assignedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt"      TIMESTAMP(3)     -- null = current head
);
CREATE INDEX IF NOT EXISTS "DepartmentHead_tenantId_idx" ON "DepartmentHead"("tenantId");
CREATE INDEX IF NOT EXISTS "DepartmentHead_departmentId_idx" ON "DepartmentHead"("departmentId");
CREATE INDEX IF NOT EXISTS "DepartmentHead_userId_idx" ON "DepartmentHead"("userId");
-- Only ONE active (endedAt IS NULL) head per department. A person MAY head many.
CREATE UNIQUE INDEX IF NOT EXISTS "DepartmentHead_one_active_per_dept"
  ON "DepartmentHead"("departmentId") WHERE "endedAt" IS NULL;

-- ── Unit.departmentId (nullable: unassigned is a legitimate state) ────────────
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
CREATE INDEX IF NOT EXISTS "Unit_departmentId_idx" ON "Unit"("departmentId");

-- ── Foreign keys (guarded, Prisma-compatible) ────────────────────────────────
DO $$ BEGIN ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "DepartmentHead" ADD CONSTRAINT "DepartmentHead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "DepartmentHead" ADD CONSTRAINT "DepartmentHead_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "DepartmentHead" ADD CONSTRAINT "DepartmentHead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "DepartmentHead" ADD CONSTRAINT "DepartmentHead_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Unit" ADD CONSTRAINT "Unit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── RLS deny-all backstop ────────────────────────────────────────────────────
-- The NestJS API (postgres role, BYPASSRLS) is the enforcement layer, scoping
-- every query by tenantId + @Roles + active DepartmentHead rows. Enabling RLS
-- with no permissive policy denies all anon/authenticated access (acceptance:
-- a second church's JWT via the anon key sees nothing). See 2026-07-cms-rls.sql.
ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DepartmentHead" ENABLE ROW LEVEL SECURITY;
