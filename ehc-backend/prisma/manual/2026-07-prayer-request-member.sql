-- ─────────────────────────────────────────────────────────────────────────────
-- Link PrayerRequest to the submitting Member (optional — public form stays public)
-- ─────────────────────────────────────────────────────────────────────────────
-- Captured only when a signed-in member submits (the form itself is still public
-- and works with no session). "Anonymous" only hides the name shown around the
-- request; admins can always see the linked member on the admin list.
-- Idempotent — safe to re-run.
--   npx prisma db execute --file prisma/manual/2026-07-prayer-request-member.sql --schema prisma/schema.prisma

ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "memberId" TEXT;
CREATE INDEX IF NOT EXISTS "PrayerRequest_tenantId_idx" ON "PrayerRequest"("tenantId");
CREATE INDEX IF NOT EXISTS "PrayerRequest_memberId_idx" ON "PrayerRequest"("memberId");

DO $$ BEGIN ALTER TABLE "PrayerRequest" ADD CONSTRAINT "PrayerRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
