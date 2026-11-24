-- Programs (public /programs and the admin manager).
-- Additive and idempotent: safe to run twice, never drops or alters an existing
-- table or column. Mirrored by prisma/migrations/20261124130000_programs.
BEGIN;

DO $$ BEGIN CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ProgramCadence" AS ENUM ('WEEKLY', 'MONTHLY', 'ANNUAL', 'CUSTOM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ProgramType" AS ENUM ('PRAYER', 'PROPHETIC', 'CONSECRATION', 'CONFERENCE', 'HOLY_GHOST', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ProgramFormat" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ProgramDateStatus" AS ENUM ('CONFIRMED', 'TBA'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ProgramNameStatus" AS ENUM ('FINAL', 'PROVISIONAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ProgramScriptureStatus" AS ENUM ('CONFIRMED', 'SUGGESTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ProgramAccent" AS ENUM ('BURGUNDY', 'CRIMSON', 'DEEP_BURGUNDY', 'GOLD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Program" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameStatus" "ProgramNameStatus" NOT NULL DEFAULT 'FINAL',
    "eyebrow" TEXT,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT,
    "programType" "ProgramType" NOT NULL DEFAULT 'OTHER',
    "cadence" "ProgramCadence" NOT NULL DEFAULT 'CUSTOM',
    "recurrenceRule" TEXT,
    "startTime" TEXT,
    "durationMinutes" INTEGER,
    "startOffsetDays" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "dateStatus" "ProgramDateStatus" NOT NULL DEFAULT 'TBA',
    "format" "ProgramFormat" NOT NULL DEFAULT 'IN_PERSON',
    "venue" TEXT,
    "streamUrl" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "accent" "ProgramAccent" NOT NULL DEFAULT 'BURGUNDY',
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "gatheringId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Program_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Program_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT "Program_startTime_format" CHECK ("startTime" IS NULL OR "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    CONSTRAINT "Program_duration_positive" CHECK ("durationMinutes" IS NULL OR "durationMinutes" BETWEEN 1 AND 20160)
);

CREATE TABLE IF NOT EXISTS "ProgramScripture" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "bookId" SMALLINT NOT NULL,
    "chapter" SMALLINT NOT NULL,
    "verseStart" SMALLINT,
    "chapterEnd" SMALLINT,
    "verseEnd" SMALLINT,
    "scriptureStatus" "ProgramScriptureStatus" NOT NULL DEFAULT 'CONFIRMED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProgramScripture_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProgramSession" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProgramSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProgramSession_times_format" CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

CREATE TABLE IF NOT EXISTS "ProgramEdition" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "theme" TEXT,
    "startsOn" DATE,
    "endsOn" DATE,
    "dateStatus" "ProgramDateStatus" NOT NULL DEFAULT 'TBA',
    "summary" TEXT,
    "recordingUrl" TEXT,
    CONSTRAINT "ProgramEdition_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProgramEdition_dates_order" CHECK ("endsOn" IS NULL OR "startsOn" IS NULL OR "endsOn" >= "startsOn")
);

CREATE INDEX IF NOT EXISTS "Program_tenantId_status_sortOrder_idx" ON "Program"("tenantId", "status", "sortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "Program_tenantId_slug_key" ON "Program"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "ProgramScripture_programId_sortOrder_idx" ON "ProgramScripture"("programId", "sortOrder");
CREATE INDEX IF NOT EXISTS "ProgramSession_programId_sortOrder_idx" ON "ProgramSession"("programId", "sortOrder");
CREATE INDEX IF NOT EXISTS "ProgramEdition_programId_startsOn_idx" ON "ProgramEdition"("programId", "startsOn");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Program_tenantId_fkey') THEN
    ALTER TABLE "Program" ADD CONSTRAINT "Program_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Program_gatheringId_fkey') THEN
    ALTER TABLE "Program" ADD CONSTRAINT "Program_gatheringId_fkey" FOREIGN KEY ("gatheringId") REFERENCES "RecurringGathering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProgramScripture_programId_fkey') THEN
    ALTER TABLE "ProgramScripture" ADD CONSTRAINT "ProgramScripture_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProgramSession_programId_fkey') THEN
    ALTER TABLE "ProgramSession" ADD CONSTRAINT "ProgramSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProgramEdition_programId_fkey') THEN
    ALTER TABLE "ProgramEdition" ADD CONSTRAINT "ProgramEdition_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Row level security. The API connects as the service role and is unaffected;
-- tenant scoping is enforced in the service layer, as everywhere in this API.
-- Supabase's anon and authenticated roles may read published programs only.
ALTER TABLE "Program" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProgramScripture" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProgramSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProgramEdition" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    DROP POLICY IF EXISTS "Program_public_read" ON "Program";
    CREATE POLICY "Program_public_read" ON "Program" FOR SELECT TO anon, authenticated USING ("status" = 'PUBLISHED');
    DROP POLICY IF EXISTS "ProgramScripture_public_read" ON "ProgramScripture";
    CREATE POLICY "ProgramScripture_public_read" ON "ProgramScripture" FOR SELECT TO anon, authenticated
      USING (EXISTS (SELECT 1 FROM "Program" p WHERE p."id" = "programId" AND p."status" = 'PUBLISHED'));
    DROP POLICY IF EXISTS "ProgramSession_public_read" ON "ProgramSession";
    CREATE POLICY "ProgramSession_public_read" ON "ProgramSession" FOR SELECT TO anon, authenticated
      USING (EXISTS (SELECT 1 FROM "Program" p WHERE p."id" = "programId" AND p."status" = 'PUBLISHED'));
    DROP POLICY IF EXISTS "ProgramEdition_public_read" ON "ProgramEdition";
    CREATE POLICY "ProgramEdition_public_read" ON "ProgramEdition" FOR SELECT TO anon, authenticated
      USING (EXISTS (SELECT 1 FROM "Program" p WHERE p."id" = "programId" AND p."status" = 'PUBLISHED'));
    GRANT SELECT ON "Program", "ProgramScripture", "ProgramSession", "ProgramEdition" TO anon, authenticated;
  END IF;
END $$;

COMMIT;
