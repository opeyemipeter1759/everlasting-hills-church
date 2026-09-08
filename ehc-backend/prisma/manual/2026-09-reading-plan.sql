-- ─────────────────────────────────────────────────────────────────────────────
-- Daily Bible reading plans: schema
-- ─────────────────────────────────────────────────────────────────────────────
-- Applied out-of-band, never with `prisma db push`:
--   npx prisma db execute --file prisma/manual/2026-09-reading-plan.sql --schema prisma/schema.prisma
--
-- Idempotent: safe to re-run.
--
-- CONVENTIONS. The source specification is written in snake_case with UUID keys.
-- This database is neither, and consistency with the other ~80 tables wins:
-- quoted PascalCase table names, camelCase columns, TEXT primary keys. The
-- tenant is "Tenant" and the person is "Profile" (not `churches` and `members`),
-- and subscriptions hang off Profile because that is what authorization resolves
-- to everywhere else in this codebase. A Member row can be edited or replaced
-- without disturbing somebody's reading streak.
--
-- Scripture tables carry a Bible prefix and live in `public` alongside
-- everything else. A separate `scripture` schema would need Prisma's multiSchema
-- preview feature, which affects every existing model; the prefix does the same
-- "this is not tenant data" job at none of that cost.
--
-- VERSIFICATION. Authoring is pinned to the Protestant 66 book KJV
-- versification. WEB and ASV agree with it almost everywhere. The known
-- divergences (Psalm superscriptions, 3 John 14/15, some Malachi and Joel
-- chapter divisions) are an accepted v1 limitation, recorded here so the next
-- person meets it as a decision rather than a bug.

-- ── 1. Scripture reference data (global, never tenant scoped) ────────────────

CREATE TABLE IF NOT EXISTS "BibleTranslation" (
  "id"        SMALLSERIAL PRIMARY KEY,
  "code"      TEXT        NOT NULL UNIQUE,        -- 'WEB', 'KJV'
  "name"      TEXT        NOT NULL,
  "language"  TEXT        NOT NULL DEFAULT 'en',
  "licence"   TEXT        NOT NULL,               -- 'public-domain'
  "isDefault" BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exactly one default across the whole table.
CREATE UNIQUE INDEX IF NOT EXISTS "BibleTranslation_single_default"
  ON "BibleTranslation" (("isDefault")) WHERE "isDefault" IS TRUE;

CREATE TABLE IF NOT EXISTS "BibleBook" (
  "id"           SMALLINT PRIMARY KEY,            -- 1..66 canonical order
  "osisCode"     TEXT     NOT NULL UNIQUE,        -- 'Gen', 'Matt', 'Rev'
  "name"         TEXT     NOT NULL,
  "shortName"    TEXT     NOT NULL,
  "testament"    TEXT     NOT NULL CHECK ("testament" IN ('OT', 'NT')),
  "chapterCount" SMALLINT NOT NULL
);

-- The core primitive: verseId = bookId * 1000000 + chapter * 1000 + verse.
-- Genesis 1:1 = 1001001, John 3:16 = 43003016, Revelation 22:21 = 66022021.
-- The maximum possible value is 66150176, comfortably inside INTEGER, so this
-- is deliberately not BIGINT. Any passage, however it spans chapters or books,
-- is one range scan on the primary key.
CREATE TABLE IF NOT EXISTS "BibleVerse" (
  "translationId" SMALLINT NOT NULL REFERENCES "BibleTranslation"("id") ON DELETE CASCADE,
  "verseId"       INTEGER  NOT NULL,
  "bookId"        SMALLINT NOT NULL REFERENCES "BibleBook"("id"),
  "chapter"       SMALLINT NOT NULL,
  "verse"         SMALLINT NOT NULL,
  "text"          TEXT     NOT NULL,
  -- Populated at ingest. This is what makes time balanced plan generation
  -- possible; it is not decoration.
  "wordCount"     SMALLINT NOT NULL,
  PRIMARY KEY ("translationId", "verseId")
);

-- The primary key already serves WHERE "translationId" = $1 AND "verseId"
-- BETWEEN $2 AND $3, so there is deliberately no second index on those columns.

-- ── 2. Plans ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ReadingTrack" AS ENUM ('NEW_BELIEVER', 'GROWING', 'MATURE', 'SEASONAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- tenantId NULL means a global template every church starts with. A church
-- forks a template into its own tenant rather than referencing it, so updating
-- a global plan can never silently rewrite what a church already published.
CREATE TABLE IF NOT EXISTS "ReadingPlan" (
  "id"               TEXT         NOT NULL,
  "tenantId"         TEXT         NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "sourcePlanId"     TEXT         NULL REFERENCES "ReadingPlan"("id") ON DELETE SET NULL,
  "slug"             TEXT         NOT NULL,
  "title"            TEXT         NOT NULL,
  "subtitle"         TEXT,
  "description"      TEXT,
  "track"            "ReadingTrack" NOT NULL,
  "durationDays"     SMALLINT     NOT NULL CHECK ("durationDays" BETWEEN 1 AND 1095),
  "avgMinutesPerDay" SMALLINT,
  "status"           "PlanStatus" NOT NULL DEFAULT 'DRAFT',
  "version"          SMALLINT     NOT NULL DEFAULT 1,
  "coverImageUrl"    TEXT,
  "createdById"      TEXT         NULL REFERENCES "Profile"("id") ON DELETE SET NULL,
  "createdAt"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT "ReadingPlan_pkey" PRIMARY KEY ("id")
);

-- A slug is unique per scope and version. Global templates share one synthetic
-- scope key because NULL never equals NULL in a unique index.
CREATE UNIQUE INDEX IF NOT EXISTS "ReadingPlan_slug_scope"
  ON "ReadingPlan" (COALESCE("tenantId", '__global__'), "slug", "version");
CREATE INDEX IF NOT EXISTS "ReadingPlan_catalog"
  ON "ReadingPlan" ("tenantId", "track", "status");

CREATE TABLE IF NOT EXISTS "ReadingPlanDay" (
  "id"               TEXT     NOT NULL,
  "planId"           TEXT     NOT NULL REFERENCES "ReadingPlan"("id") ON DELETE CASCADE,
  -- Denormalised from the plan so a row level policy never needs a join back.
  "tenantId"         TEXT     NULL,
  "dayIndex"         SMALLINT NOT NULL CHECK ("dayIndex" >= 1),
  "title"            TEXT,
  "reflectionPrompt" TEXT,
  -- Precomputed at generation time, for example 'Genesis 1-3 · Matthew 1'. The
  -- dashboard card must never work out a reading estimate at request time.
  "referenceLabel"   TEXT     NOT NULL,
  "totalWordCount"   INTEGER  NOT NULL DEFAULT 0,
  "estimatedMinutes" SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT "ReadingPlanDay_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReadingPlanDay_plan_day" UNIQUE ("planId", "dayIndex")
);
CREATE INDEX IF NOT EXISTS "ReadingPlanDay_tenant" ON "ReadingPlanDay" ("tenantId");

CREATE TABLE IF NOT EXISTS "ReadingPlanPortion" (
  "id"           TEXT     NOT NULL,
  "planDayId"    TEXT     NOT NULL REFERENCES "ReadingPlanDay"("id") ON DELETE CASCADE,
  "tenantId"     TEXT     NULL,
  "sequence"     SMALLINT NOT NULL,
  "label"        TEXT,                            -- 'Gospel', 'Old Testament', 'Psalm'
  "startVerseId" INTEGER  NOT NULL,
  "endVerseId"   INTEGER  NOT NULL,
  "isOptional"   BOOLEAN  NOT NULL DEFAULT FALSE,
  "wordCount"    INTEGER  NOT NULL DEFAULT 0,
  CONSTRAINT "ReadingPlanPortion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReadingPlanPortion_range" CHECK ("endVerseId" >= "startVerseId"),
  CONSTRAINT "ReadingPlanPortion_day_sequence" UNIQUE ("planDayId", "sequence")
);
CREATE INDEX IF NOT EXISTS "ReadingPlanPortion_tenant" ON "ReadingPlanPortion" ("tenantId");

-- ── 3. Member subscription and progress ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "MemberPlanSubscription" (
  "id"              TEXT                 NOT NULL,
  "tenantId"        TEXT                 NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "profileId"       TEXT                 NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "planId"          TEXT                 NOT NULL REFERENCES "ReadingPlan"("id"),
  "planVersion"     SMALLINT             NOT NULL,
  "translationId"   SMALLINT             NOT NULL REFERENCES "BibleTranslation"("id"),
  "status"          "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "startedOn"       DATE                 NOT NULL,
  -- Reserved. A non null anchor marks a calendar anchored church wide plan,
  -- which can then coexist with a personal plan without a schema change.
  "anchorDate"      DATE                 NULL,
  "timezone"        TEXT                 NOT NULL DEFAULT 'Africa/Lagos',
  "currentDayIndex" SMALLINT             NOT NULL DEFAULT 1,
  "completedDays"   SMALLINT             NOT NULL DEFAULT 0,
  "currentStreak"   SMALLINT             NOT NULL DEFAULT 0,
  "longestStreak"   SMALLINT             NOT NULL DEFAULT 0,
  "lastReadOn"      DATE                 NULL,    -- member local date, never UTC
  "graceUsedOn"     DATE                 NULL,
  "reminderHour"    SMALLINT             NULL CHECK ("reminderHour" BETWEEN 0 AND 23),
  "completedAt"     TIMESTAMPTZ          NULL,
  "createdAt"       TIMESTAMPTZ          NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ          NOT NULL DEFAULT now(),
  CONSTRAINT "MemberPlanSubscription_pkey" PRIMARY KEY ("id")
);

-- One active personal plan per person.
CREATE UNIQUE INDEX IF NOT EXISTS "MemberPlanSubscription_one_active_personal"
  ON "MemberPlanSubscription" ("profileId")
  WHERE "status" = 'ACTIVE' AND "anchorDate" IS NULL;

CREATE INDEX IF NOT EXISTS "MemberPlanSubscription_reminder_sweep"
  ON "MemberPlanSubscription" ("reminderHour", "status")
  WHERE "reminderHour" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "MemberPlanSubscription_profile"
  ON "MemberPlanSubscription" ("profileId", "status");

-- Progress is sparse: only completed days get a row. Never pre-create a row per
-- day per subscriber. The unique constraint is what makes completion
-- idempotent, so a double tap, a retried request and an offline replay all
-- settle to the same state.
CREATE TABLE IF NOT EXISTS "MemberPlanProgress" (
  "id"             TEXT        NOT NULL,
  "subscriptionId" TEXT        NOT NULL REFERENCES "MemberPlanSubscription"("id") ON DELETE CASCADE,
  "tenantId"       TEXT        NOT NULL,
  "profileId"      TEXT        NOT NULL,
  "dayIndex"       SMALLINT    NOT NULL,
  "completedOn"    DATE        NOT NULL,          -- member local date, not UTC
  "completedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "portionsDone"   SMALLINT    NOT NULL DEFAULT 0,
  CONSTRAINT "MemberPlanProgress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MemberPlanProgress_sub_day" UNIQUE ("subscriptionId", "dayIndex")
);
CREATE INDEX IF NOT EXISTS "MemberPlanProgress_recent"
  ON "MemberPlanProgress" ("subscriptionId", "dayIndex" DESC);

-- Pastoral class data. Same guardrail as prayer requests: the writer reads it
-- and nobody else, no leader role, no AI pipeline, scrubbed from error
-- reporting. Enforced in the service layer, which is where this codebase
-- enforces every other scope (see the RLS note below).
CREATE TABLE IF NOT EXISTS "MemberPlanReflection" (
  "id"             TEXT        NOT NULL,
  "subscriptionId" TEXT        NOT NULL REFERENCES "MemberPlanSubscription"("id") ON DELETE CASCADE,
  "tenantId"       TEXT        NOT NULL,
  "profileId"      TEXT        NOT NULL,
  "dayIndex"       SMALLINT    NOT NULL,
  "body"           TEXT        NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "MemberPlanReflection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MemberPlanReflection_sub_day" UNIQUE ("subscriptionId", "dayIndex")
);

-- ── 4. Published plans are immutable ────────────────────────────────────────
-- A member sitting on day 87 must not have tomorrow rewritten underneath them.
-- The service layer blocks this too; this trigger is the backstop that survives
-- a script, a console session, or a future endpoint that forgets.
-- Title, subtitle, description and status transitions stay editable.

CREATE OR REPLACE FUNCTION "readingPlanImmutableWhenPublished"()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."status" = 'PUBLISHED' THEN
    IF NEW."durationDays" IS DISTINCT FROM OLD."durationDays" THEN
      RAISE EXCEPTION 'Cannot change durationDays on a published reading plan';
    END IF;
    IF NEW."track" IS DISTINCT FROM OLD."track" THEN
      RAISE EXCEPTION 'Cannot change track on a published reading plan';
    END IF;
    IF NEW."version" IS DISTINCT FROM OLD."version" THEN
      RAISE EXCEPTION 'Cannot change version on a published reading plan';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "ReadingPlan_immutable_when_published" ON "ReadingPlan";
CREATE TRIGGER "ReadingPlan_immutable_when_published"
  BEFORE UPDATE ON "ReadingPlan"
  FOR EACH ROW EXECUTE FUNCTION "readingPlanImmutableWhenPublished"();

CREATE OR REPLACE FUNCTION "readingPlanChildLockedWhenPublished"()
RETURNS TRIGGER AS $$
DECLARE
  plan_status "PlanStatus";
  target_plan TEXT;
BEGIN
  IF TG_TABLE_NAME = 'ReadingPlanDay' THEN
    target_plan := COALESCE(NEW."planId", OLD."planId");
  ELSE
    SELECT d."planId" INTO target_plan
    FROM "ReadingPlanDay" d
    WHERE d."id" = COALESCE(NEW."planDayId", OLD."planDayId");
  END IF;

  SELECT p."status" INTO plan_status FROM "ReadingPlan" p WHERE p."id" = target_plan;

  IF plan_status = 'PUBLISHED' THEN
    -- Editing the reflection prompt is allowed; changing what is read is not.
    IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'ReadingPlanDay' THEN
      IF NEW."referenceLabel" IS NOT DISTINCT FROM OLD."referenceLabel"
         AND NEW."dayIndex" IS NOT DISTINCT FROM OLD."dayIndex" THEN
        RETURN NEW;
      END IF;
    END IF;
    RAISE EXCEPTION 'Cannot change the readings of a published plan';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "ReadingPlanDay_locked_when_published" ON "ReadingPlanDay";
CREATE TRIGGER "ReadingPlanDay_locked_when_published"
  BEFORE UPDATE OR DELETE ON "ReadingPlanDay"
  FOR EACH ROW EXECUTE FUNCTION "readingPlanChildLockedWhenPublished"();

DROP TRIGGER IF EXISTS "ReadingPlanPortion_locked_when_published" ON "ReadingPlanPortion";
CREATE TRIGGER "ReadingPlanPortion_locked_when_published"
  BEFORE INSERT OR UPDATE OR DELETE ON "ReadingPlanPortion"
  FOR EACH ROW EXECUTE FUNCTION "readingPlanChildLockedWhenPublished"();

-- ── 5. Row Level Security ───────────────────────────────────────────────────
-- Identical model to prisma/manual/2026-07-cms-rls.sql and the PWA tables,
-- deliberately.
--
-- The NestJS API is the enforcement layer. It connects as the Supabase
-- `postgres` role, which has BYPASSRLS, and scopes every query by tenantId plus
-- the caller's own profileId. Enabling RLS with no permissive policy is
-- deny-all for every non BYPASSRLS role, so any direct anon or authenticated
-- client that reaches these tables gets nothing.
--
-- True per row policies evaluated inside Postgres need per request Supabase
-- clients carrying a tenant bearing JWT. That is a cross cutting change this
-- codebase has deferred by design, and writing permissive policies here before
-- it lands would buy nothing while creating the impression that isolation is
-- enforced by the database. It is enforced in the service layer.
--
-- Consequence to hold onto: "no role, not even Super Admin, reads another
-- member's reflection" is a service layer guarantee here, not a SQL one.

ALTER TABLE "ReadingPlan"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReadingPlanDay"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReadingPlanPortion"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MemberPlanSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MemberPlanProgress"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MemberPlanReflection"   ENABLE ROW LEVEL SECURITY;

-- Scripture is public domain text with no member data in it, and is readable by
-- design. RLS is still enabled so nothing reaches it through the anon key
-- without going past the API.
ALTER TABLE "BibleTranslation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BibleBook"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BibleVerse"       ENABLE ROW LEVEL SECURITY;
