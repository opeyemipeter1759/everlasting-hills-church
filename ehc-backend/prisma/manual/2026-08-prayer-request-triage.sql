-- ─────────────────────────────────────────────────────────────────────────────
-- PrayerRequest: AI triage columns — deterministic create
-- ─────────────────────────────────────────────────────────────────────────────
-- Applied out-of-band (see prisma/manual/2026-08-pwa-notifications.sql for why
-- `prisma db push` is not used on this project):
--   npx prisma db execute --file prisma/manual/2026-08-prayer-request-triage.sql --schema prisma/schema.prisma
--
-- Idempotent: safe to re-run.
--
-- Plain TEXT rather than Postgres enums: Gemini's output isn't guaranteed to
-- match a fixed set of values, and an enum violation would throw on save where
-- a stray value should just display as-is. All four are NULL until triage
-- completes (or if it fails / GEMINI_API_KEY is unset).
ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "aiCategory" TEXT;
ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "aiUrgency" TEXT;
ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "aiRouteTo" TEXT;
ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "aiSummary" TEXT;
ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "aiTriagedAt" TIMESTAMP(3);
