-- ─────────────────────────────────────────────────────────────────────────────
-- PrayerRequest.status (PENDING / PRAYED) — lets admins mark a request prayed for.
--   npx prisma db execute --file prisma/manual/2026-07-prayer-request-status.sql --schema prisma/schema.prisma
-- Safe to re-run.

DO $$ BEGIN
  CREATE TYPE "PrayerRequestStatus" AS ENUM ('PENDING', 'PRAYED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "status" "PrayerRequestStatus" NOT NULL DEFAULT 'PENDING';
