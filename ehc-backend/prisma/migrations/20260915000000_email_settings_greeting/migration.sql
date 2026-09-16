-- AlterTable (idempotent: safe to re-run if a previous attempt was recorded but did not land)
ALTER TABLE "EmailSettings" ADD COLUMN IF NOT EXISTS "greeting" TEXT;
