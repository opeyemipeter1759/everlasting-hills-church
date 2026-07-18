-- ─────────────────────────────────────────────────────────────────────────────
-- Course categories (parent/child hierarchy for Udemy-style browsing)
-- ─────────────────────────────────────────────────────────────────────────────
-- `prisma db push` is unreliable against the Supabase transaction pooler. This
-- idempotent SQL creates the CourseCategory table, the Course.categoryId column,
-- and backfills a top-level category per existing distinct Course.category value.
--   npx prisma db execute --file prisma/manual/2026-07-course-categories.sql --schema prisma/schema.prisma
-- Safe to re-run.

-- ── CourseCategory ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CourseCategory" (
  "id"        TEXT PRIMARY KEY,
  "tenantId"  TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "parentId"  TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "CourseCategory_tenantId_slug_key" ON "CourseCategory"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "CourseCategory_tenantId_idx" ON "CourseCategory"("tenantId");
CREATE INDEX IF NOT EXISTS "CourseCategory_parentId_idx" ON "CourseCategory"("parentId");

-- ── Course.categoryId (nullable: enforced required at the app layer, not DB) ──
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
CREATE INDEX IF NOT EXISTS "Course_categoryId_idx" ON "Course"("categoryId");

-- ── Foreign keys (guarded, Prisma-compatible) ────────────────────────────────
DO $$ BEGIN ALTER TABLE "CourseCategory" ADD CONSTRAINT "CourseCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "CourseCategory" ADD CONSTRAINT "CourseCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CourseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CourseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Backfill: one top-level CourseCategory per distinct legacy Course.category
-- text value, then point matching courses at it. Guarded by categoryId IS NULL
-- so this is idempotent and a no-op once every course has been migrated. The
-- legacy "category" text column itself is left in place (unmapped, harmless)
-- rather than dropped — no destructive DDL against the shared live DB.
DO $$
DECLARE r RECORD;
DECLARE newId TEXT;
DECLARE baseSlug TEXT;
DECLARE candidateSlug TEXT;
DECLARE suffix INTEGER;
BEGIN
  FOR r IN
    SELECT DISTINCT "tenantId", "category"
    FROM "Course"
    WHERE "categoryId" IS NULL AND "category" IS NOT NULL AND trim("category") <> ''
  LOOP
    baseSlug := lower(regexp_replace(trim(r."category"), '[^a-zA-Z0-9]+', '-', 'g'));
    baseSlug := trim(both '-' from baseSlug);
    IF baseSlug = '' THEN baseSlug := 'category'; END IF;
    candidateSlug := baseSlug;
    suffix := 2;
    WHILE EXISTS (SELECT 1 FROM "CourseCategory" WHERE "tenantId" = r."tenantId" AND "slug" = candidateSlug) LOOP
      candidateSlug := baseSlug || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;

    newId := gen_random_uuid()::text;
    INSERT INTO "CourseCategory" ("id", "tenantId", "name", "slug", "parentId", "sortOrder")
    VALUES (newId, r."tenantId", r."category", candidateSlug, NULL, 0);

    UPDATE "Course"
    SET "categoryId" = newId
    WHERE "tenantId" = r."tenantId" AND "category" = r."category" AND "categoryId" IS NULL;
  END LOOP;
END $$;

-- ── RLS deny-all backstop ────────────────────────────────────────────────────
-- The NestJS API (postgres role, BYPASSRLS) is the enforcement layer. Enabling
-- RLS with no permissive policy denies all anon/authenticated access.
ALTER TABLE "CourseCategory" ENABLE ROW LEVEL SECURITY;
