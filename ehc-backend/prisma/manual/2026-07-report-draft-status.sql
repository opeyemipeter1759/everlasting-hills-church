-- ─────────────────────────────────────────────────────────────────────────────
-- Report.status gains DRAFT — a report can be saved without being sent for review.
-- ─────────────────────────────────────────────────────────────────────────────
-- `prisma db push` is unreliable against the Supabase transaction pooler. This
-- idempotent SQL adds the new enum value directly.
--   npx prisma db execute --file prisma/manual/2026-07-report-draft-status.sql --schema prisma/schema.prisma
-- Safe to re-run.

ALTER TYPE "ReportStatus" ADD VALUE IF NOT EXISTS 'DRAFT' BEFORE 'SUBMITTED';
