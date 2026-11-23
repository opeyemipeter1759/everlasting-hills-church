-- ─────────────────────────────────────────────────────────────────────────────
-- Adds SETMAN as a homepage CMS section ("A word from our Set Man", shown above
-- the About section, components/home/SetmanSection.tsx). The row itself is
-- seeded from DEFAULT_CONTENT on the next backend boot.
-- ─────────────────────────────────────────────────────────────────────────────
-- Safe to re-run.
--   npx prisma db execute --file prisma/manual/2026-11-setman-section.sql --schema prisma/schema.prisma

ALTER TYPE "SiteSection" ADD VALUE IF NOT EXISTS 'SETMAN';
