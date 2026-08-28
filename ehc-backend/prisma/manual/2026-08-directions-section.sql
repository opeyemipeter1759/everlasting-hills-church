-- ─────────────────────────────────────────────────────────────────────────────
-- Adds DIRECTIONS as a homepage CMS section (the footer-slab "Find Us" panel,
-- components/home/DirectionsSection.tsx — previously hardcoded, now editable
-- from the site-settings admin editor same as every other section).
-- ─────────────────────────────────────────────────────────────────────────────
-- Safe to re-run.
--   npx prisma db execute --file prisma/manual/2026-08-directions-section.sql --schema prisma/schema.prisma

ALTER TYPE "SiteSection" ADD VALUE IF NOT EXISTS 'DIRECTIONS';
