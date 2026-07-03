-- ─────────────────────────────────────────────────────────────────────────────
-- Public-site CMS tables — deterministic create
-- ─────────────────────────────────────────────────────────────────────────────
-- `prisma db push` is unreliable against the Supabase transaction pooler (it has
-- falsely reported "in sync" while applying nothing, and has dropped these tables
-- between sessions). This idempotent SQL recreates the CMS tables directly.
--   npx prisma db execute --file prisma/manual/2026-07-cms-tables.sql --schema prisma/schema.prisma
-- Safe to re-run.

DO $$ BEGIN
  CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Page" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedVersionId" TEXT,
  "cacheTag" TEXT NOT NULL,
  "featureFlag" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "Page_tenantId_key_key" ON "Page"("tenantId", "key");
CREATE INDEX IF NOT EXISTS "Page_tenantId_status_idx" ON "Page"("tenantId", "status");

CREATE TABLE IF NOT EXISTS "ContentVersion" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "content" JSONB NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "publishedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContentVersion_pageId_version_key" ON "ContentVersion"("pageId", "version");
CREATE INDEX IF NOT EXISTS "ContentVersion_tenantId_pageId_idx" ON "ContentVersion"("tenantId", "pageId");

CREATE TABLE IF NOT EXISTS "MediaAsset" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "r2Key" TEXT NOT NULL,
  "alt" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "uploadedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "MediaAsset_tenantId_createdAt_idx" ON "MediaAsset"("tenantId", "createdAt");

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "before" JSONB,
  "after" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_entity_entityId_idx" ON "AuditLog"("tenantId", "entity", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

CREATE TABLE IF NOT EXISTS "SiteConfig" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "SiteConfig_tenantId_key" ON "SiteConfig"("tenantId");

-- Foreign keys (guarded — Prisma-compatible)
DO $$ BEGIN ALTER TABLE "Page" ADD CONSTRAINT "Page_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Page" ADD CONSTRAINT "Page_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "ContentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "SiteConfig" ADD CONSTRAINT "SiteConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS backstop (see 2026-07-cms-rls.sql for rationale)
ALTER TABLE "Page" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
