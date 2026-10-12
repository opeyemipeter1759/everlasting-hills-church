-- Deploy through prisma migrate deploy only.
-- Comments on published articles, from members or visitors to the public blog.
CREATE TABLE IF NOT EXISTS "ArticleComment" (
  "id"         TEXT NOT NULL,
  "tenantId"   TEXT NOT NULL,
  "articleId"  TEXT NOT NULL,
  "profileId"  TEXT,
  "authorName" TEXT NOT NULL,
  "body"       TEXT NOT NULL,
  "createdAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticleComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ArticleComment_articleId_createdAt_idx" ON "ArticleComment"("articleId", "createdAt");
CREATE INDEX IF NOT EXISTS "ArticleComment_tenantId_createdAt_idx" ON "ArticleComment"("tenantId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "ArticleComment" ADD CONSTRAINT "ArticleComment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "MemberArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
