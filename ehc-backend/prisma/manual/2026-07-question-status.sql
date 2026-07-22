-- ─────────────────────────────────────────────────────────────────────────────
-- Question.status (PENDING / ANSWERED) — lets admins mark a question answered.
--   npx prisma db execute --file prisma/manual/2026-07-question-status.sql --schema prisma/schema.prisma
-- Safe to re-run.

DO $$ BEGIN
  CREATE TYPE "QuestionStatus" AS ENUM ('PENDING', 'ANSWERED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING';
