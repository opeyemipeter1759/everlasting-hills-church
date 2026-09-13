-- Member articles go through review before the church reads them.
--
-- Deploy through prisma migrate deploy only.
--
-- Idempotent. Safe to re-run. Additive only: a new enum value and four
-- nullable columns, so the backend already deployed keeps working against it.
--
-- The approver is the HOD of the department that owns the Content Writing
-- Team, resolved in the service from the unit, not stored here. Pastors and
-- admins can also approve, so nothing waits forever on an empty seat.

-- PENDING_REVIEW sits between DRAFT and PUBLISHED so ordering by status keeps
-- reading in the order a piece actually moves: draft, in review, published.
ALTER TYPE "ArticleStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW' BEFORE 'PUBLISHED';

ALTER TABLE "MemberArticle"
  ADD COLUMN IF NOT EXISTS "submittedAt"  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "reviewedAt"   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "reviewedById" TEXT,
  -- Why it came back, or a word of encouragement with the approval. Shown to
  -- the author; kept after approval so the history is not lost.
  ADD COLUMN IF NOT EXISTS "reviewNote"   TEXT;

-- SET NULL, not CASCADE: deleting a reviewer must not delete the articles they
-- approved, and it must not block the delete either. The member deletion
-- guard treats an optional relation as SetNull, which this matches.
DO $$ BEGIN
  ALTER TABLE "MemberArticle"
    ADD CONSTRAINT "MemberArticle_reviewer_fkey" FOREIGN KEY ("reviewedById")
    REFERENCES "Profile"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "MemberArticle" ADD COLUMN IF NOT EXISTS "revision" INTEGER NOT NULL DEFAULT 1;
