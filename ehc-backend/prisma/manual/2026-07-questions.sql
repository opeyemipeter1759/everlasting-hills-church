-- ─────────────────────────────────────────────────────────────────────────────
-- Question (public "Ask a Question" submissions — mirrors PrayerRequest)
-- ─────────────────────────────────────────────────────────────────────────────
-- `prisma db push` is unreliable against the Supabase transaction pooler. This
-- idempotent SQL creates the Question table directly.
--   npx prisma db execute --file prisma/manual/2026-07-questions.sql --schema prisma/schema.prisma
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS "Question" (
  "id"          TEXT PRIMARY KEY,
  "tenantId"    TEXT NOT NULL,
  "name"        TEXT,
  "email"       TEXT,
  "phone"       TEXT,
  "question"    TEXT NOT NULL,
  "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "memberId"    TEXT
);
CREATE INDEX IF NOT EXISTS "Question_tenantId_idx" ON "Question"("tenantId");
CREATE INDEX IF NOT EXISTS "Question_memberId_idx" ON "Question"("memberId");

-- ── Foreign keys (guarded, Prisma-compatible) ────────────────────────────────
DO $$ BEGIN ALTER TABLE "Question" ADD CONSTRAINT "Question_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Question" ADD CONSTRAINT "Question_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── RLS deny-all backstop ────────────────────────────────────────────────────
-- The NestJS API (postgres role, BYPASSRLS) is the enforcement layer.
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
