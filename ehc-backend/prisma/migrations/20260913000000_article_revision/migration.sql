-- Optimistic concurrency for member articles.
--
-- Deploy through prisma migrate deploy only.
--
-- The article services compare-and-set on "revision", so a reviewer can only
-- approve the exact text they read, and an author's edit cannot silently
-- overwrite an approval that landed a moment earlier. The code reads and
-- writes this column; without it every article query fails with
-- "column MemberArticle.revision does not exist".
--
-- Idempotent and additive. Existing rows start at 1, matching @default(1), and
-- NOT NULL with a constant default is a metadata-only change on Postgres 11+,
-- so it does not rewrite the table.
ALTER TABLE "MemberArticle"
  ADD COLUMN IF NOT EXISTS "revision" INTEGER NOT NULL DEFAULT 1;
