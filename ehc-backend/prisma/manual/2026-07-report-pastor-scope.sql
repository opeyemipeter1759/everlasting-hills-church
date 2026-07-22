-- ─────────────────────────────────────────────────────────────────────────────
-- Add PASTOR to ReportScope (pastors can log their own personal status reports,
-- same flow as My Department / My Unit — no departmentId/unitId needed).
-- ─────────────────────────────────────────────────────────────────────────────
--   npx prisma db execute --file prisma/manual/2026-07-report-pastor-scope.sql --schema prisma/schema.prisma
-- Safe to re-run.

ALTER TYPE "ReportScope" ADD VALUE IF NOT EXISTS 'PASTOR';
