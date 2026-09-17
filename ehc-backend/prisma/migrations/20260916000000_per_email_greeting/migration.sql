-- AlterTable: per-email salutation overrides (null = church-wide EmailSettings.greeting)
ALTER TABLE "EmailTemplate" ADD COLUMN IF NOT EXISTS "greeting" TEXT;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "greeting" TEXT;
