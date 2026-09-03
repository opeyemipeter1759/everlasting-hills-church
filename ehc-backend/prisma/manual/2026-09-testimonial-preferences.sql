-- ─────────────────────────────────────────────────────────────────────────────
-- Testimonial submitter preferences: anonymity + willingness to share physically
-- (in-person at a service), captured on the public testimony form so the
-- pastoral team can see them when reviewing/publishing (Testimonial.isAnonymous,
-- Testimonial.sharePhysically). Mirrors the existing PrayerRequest/Question
-- isAnonymous convention.
--   npx prisma db execute --file prisma/manual/2026-09-testimonial-preferences.sql --schema prisma/schema.prisma
-- Safe to re-run.

ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "sharePhysically" BOOLEAN;
ALTER TABLE "Testimonial" ADD COLUMN IF NOT EXISTS "memberId" TEXT;

DO $$ BEGIN
  ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "Testimonial_memberId_idx" ON "Testimonial"("memberId");
