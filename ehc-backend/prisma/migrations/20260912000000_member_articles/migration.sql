-- Member articles: what people are learning, written for the church to read.
--
-- Promoted from the historical manual migration. Deploy through prisma migrate deploy only.
--
-- Idempotent. Safe to re-run.
--
-- Shape follows the reading plan tables: TEXT ids, quoted camelCase, tenant
-- scoped, RLS enabled with no permissive policy, which is deny all to any role
-- without BYPASSRLS and matches how the rest of this database is protected.
--
-- An article may cite the passage it came from. That is the whole reason this
-- lives next to the reading plan rather than in a generic blog table: somebody
-- reads Romans 8 in the morning and writes about Romans 8, and the citation is
-- a verse range, addressed the same way every other passage in the system is.

-- ── Status ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Articles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MemberArticle" (
  "id"              TEXT NOT NULL,
  "tenantId"        TEXT NOT NULL,
  -- The author is a Profile, like every other actor in this system.
  "authorId"        TEXT NOT NULL,
  "slug"            TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  -- Written in the same small Markdown subset the announcements use, so what an
  -- author types renders the way they expect without a second editor.
  "body"            TEXT NOT NULL,
  "excerpt"         TEXT,
  "coverImageUrl"   TEXT,
  "status"          "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
  -- Optional scripture citation, as a verse range.
  "startVerseId"    INTEGER,
  "endVerseId"      INTEGER,
  "scriptureLabel"  TEXT,
  "readingMinutes"  SMALLINT NOT NULL DEFAULT 1,
  "viewCount"       INTEGER NOT NULL DEFAULT 0,
  "likeCount"       INTEGER NOT NULL DEFAULT 0,
  -- Set by a pastor or admin to put a piece in front of the church.
  "featuredAt"      TIMESTAMPTZ,
  "publishedAt"     TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "MemberArticle_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MemberArticle_tenant_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "MemberArticle_author_fkey" FOREIGN KEY ("authorId")
    REFERENCES "Profile"("id") ON DELETE CASCADE,
  CONSTRAINT "MemberArticle_verse_range" CHECK (
    ("startVerseId" IS NULL AND "endVerseId" IS NULL)
    OR ("startVerseId" IS NOT NULL AND "endVerseId" IS NOT NULL AND "endVerseId" >= "startVerseId")
  )
);

-- A slug is unique per church, not globally, so two churches can both have
-- somebody writing "what-romans-8-showed-me".
CREATE UNIQUE INDEX IF NOT EXISTS "MemberArticle_tenant_slug"
  ON "MemberArticle" ("tenantId", "slug");

-- The feed: published pieces newest first.
CREATE INDEX IF NOT EXISTS "MemberArticle_feed"
  ON "MemberArticle" ("tenantId", "status", "publishedAt" DESC);

-- An author's own shelf, drafts included.
CREATE INDEX IF NOT EXISTS "MemberArticle_author"
  ON "MemberArticle" ("authorId", "status", "updatedAt" DESC);

-- Everything written about a passage, which is what makes a citation worth
-- storing as a range rather than a string.
CREATE INDEX IF NOT EXISTS "MemberArticle_scripture"
  ON "MemberArticle" ("tenantId", "startVerseId", "endVerseId")
  WHERE "startVerseId" IS NOT NULL;

-- ── Likes ────────────────────────────────────────────────────────────────────
-- One row per reader per article. A count on the article would be a counter to
-- keep honest across retries; a row makes "have I liked this" a lookup and the
-- unique index makes a double tap harmless.
CREATE TABLE IF NOT EXISTS "MemberArticleLike" (
  "id"        TEXT NOT NULL,
  "tenantId"  TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "MemberArticleLike_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MemberArticleLike_tenant_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "MemberArticleLike_article_fkey" FOREIGN KEY ("articleId")
    REFERENCES "MemberArticle"("id") ON DELETE CASCADE,
  CONSTRAINT "MemberArticleLike_profile_fkey" FOREIGN KEY ("profileId")
    REFERENCES "Profile"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MemberArticleLike_once"
  ON "MemberArticleLike" ("articleId", "profileId");

-- ── Row level security ───────────────────────────────────────────────────────
-- Enabled with no permissive policy: deny all to any role without BYPASSRLS,
-- which is the pattern the CMS, PWA and reading plan tables already follow here.
-- Tenant scoping and authorship are enforced in the service layer, and that is
-- a deliberate, documented limitation of this codebase rather than an oversight.
ALTER TABLE "MemberArticle"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MemberArticleLike" ENABLE ROW LEVEL SECURITY;

-- ── updatedAt ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION "memberArticle_touch"() RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "MemberArticle_touch" ON "MemberArticle";
CREATE TRIGGER "MemberArticle_touch"
  BEFORE UPDATE ON "MemberArticle"
  FOR EACH ROW EXECUTE FUNCTION "memberArticle_touch"();
