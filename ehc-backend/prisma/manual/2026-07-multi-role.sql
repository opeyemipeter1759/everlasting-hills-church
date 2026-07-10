-- ─────────────────────────────────────────────────────────────────────────────
-- Multi-role identity: grants + assignments (deterministic create)
-- ─────────────────────────────────────────────────────────────────────────────
-- Replaces the single Profile.role source of truth. Applied via prisma db execute
-- (NOT db push). Idempotent; safe to re-run. Column rename + backfill run
-- separately (see 2026-07-multi-role-rename.sql and seed/backfill script).

-- RoleGrant: explicit global granted roles (PASTOR, ADMIN, SUPER_ADMIN),
-- history-preserving. One active grant per (user, role).
CREATE TABLE IF NOT EXISTS "RoleGrant" (
  "id"          TEXT PRIMARY KEY,
  "tenantId"    TEXT NOT NULL,
  "userId"      TEXT NOT NULL,          -- Profile.id
  "role"        "Role" NOT NULL,        -- constrained to PASTOR/ADMIN/SUPER_ADMIN in the service
  "grantedById" TEXT,                   -- Profile.id of the actor
  "grantedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt"     TIMESTAMP(3)            -- null = active
);
CREATE INDEX IF NOT EXISTS "RoleGrant_tenantId_idx" ON "RoleGrant"("tenantId");
CREATE INDEX IF NOT EXISTS "RoleGrant_userId_idx" ON "RoleGrant"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "RoleGrant_active_uq" ON "RoleGrant"("userId", "role") WHERE "endedAt" IS NULL;

-- UnitLeadAssignment: history-preserving unit leadership. One active lead per unit.
CREATE TABLE IF NOT EXISTS "UnitLeadAssignment" (
  "id"           TEXT PRIMARY KEY,
  "tenantId"     TEXT NOT NULL,
  "unitId"       TEXT NOT NULL,
  "userId"       TEXT NOT NULL,         -- Profile.id
  "assignedById" TEXT,
  "assignedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt"      TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "UnitLeadAssignment_tenantId_idx" ON "UnitLeadAssignment"("tenantId");
CREATE INDEX IF NOT EXISTS "UnitLeadAssignment_unitId_idx" ON "UnitLeadAssignment"("unitId");
CREATE INDEX IF NOT EXISTS "UnitLeadAssignment_userId_idx" ON "UnitLeadAssignment"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "UnitLeadAssignment_active_uq" ON "UnitLeadAssignment"("unitId") WHERE "endedAt" IS NULL;

-- HeadUsherAssignment: head usher is a global (unscoped) derived role.
CREATE TABLE IF NOT EXISTS "HeadUsherAssignment" (
  "id"           TEXT PRIMARY KEY,
  "tenantId"     TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "assignedById" TEXT,
  "assignedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt"      TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "HeadUsherAssignment_tenantId_idx" ON "HeadUsherAssignment"("tenantId");
CREATE INDEX IF NOT EXISTS "HeadUsherAssignment_userId_idx" ON "HeadUsherAssignment"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "HeadUsherAssignment_active_uq" ON "HeadUsherAssignment"("userId") WHERE "endedAt" IS NULL;

-- Foreign keys (guarded, Prisma-compatible)
DO $$ BEGIN ALTER TABLE "RoleGrant" ADD CONSTRAINT "RoleGrant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "RoleGrant" ADD CONSTRAINT "RoleGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "RoleGrant" ADD CONSTRAINT "RoleGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "UnitLeadAssignment" ADD CONSTRAINT "UnitLeadAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "UnitLeadAssignment" ADD CONSTRAINT "UnitLeadAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "UnitLeadAssignment" ADD CONSTRAINT "UnitLeadAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "UnitLeadAssignment" ADD CONSTRAINT "UnitLeadAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "HeadUsherAssignment" ADD CONSTRAINT "HeadUsherAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "HeadUsherAssignment" ADD CONSTRAINT "HeadUsherAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "HeadUsherAssignment" ADD CONSTRAINT "HeadUsherAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS deny-all backstop (API is the enforcement layer; see 2026-07-cms-rls.sql).
ALTER TABLE "RoleGrant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UnitLeadAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HeadUsherAssignment" ENABLE ROW LEVEL SECURITY;
