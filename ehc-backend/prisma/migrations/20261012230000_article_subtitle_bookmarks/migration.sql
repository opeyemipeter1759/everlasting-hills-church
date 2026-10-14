-- Deploy through prisma migrate deploy only.
-- An author's own subtitle for an article, and articles members save to read later.
ALTER TABLE "MemberArticle" ADD COLUMN IF NOT EXISTS "subtitle" TEXT;

CREATE TABLE IF NOT EXISTS "ArticleBookmark" (
  "id"        TEXT NOT NULL,
  "tenantId"  TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticleBookmark_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ArticleBookmark_articleId_profileId_key" ON "ArticleBookmark"("articleId", "profileId");
CREATE INDEX IF NOT EXISTS "ArticleBookmark_profileId_createdAt_idx" ON "ArticleBookmark"("profileId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "ArticleBookmark" ADD CONSTRAINT "ArticleBookmark_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "MemberArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
