-- Deploy through prisma migrate deploy only.
-- Private notes between an article's author and its reviewers, sent without
-- approving or returning the piece, optionally about a highlighted passage
-- with suggested wording, as comments and suggestions work in Google Docs.
CREATE TABLE IF NOT EXISTS "ArticleReviewNote" (
  "id"           TEXT NOT NULL,
  "tenantId"     TEXT NOT NULL,
  "articleId"    TEXT NOT NULL,
  "profileId"    TEXT NOT NULL,
  "authorName"   TEXT NOT NULL,
  "fromReviewer" BOOLEAN NOT NULL,
  "body"         TEXT NOT NULL,
  "quote"        TEXT,
  "suggestion"   TEXT,
  "resolvedAt"   TIMESTAMPTZ(6),
  "createdAt"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticleReviewNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ArticleReviewNote_articleId_createdAt_idx" ON "ArticleReviewNote"("articleId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "ArticleReviewNote" ADD CONSTRAINT "ArticleReviewNote_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "MemberArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
