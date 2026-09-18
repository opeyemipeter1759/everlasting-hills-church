-- Deploy through prisma migrate deploy only.

-- AlterTable: who asked for the WhatsApp community and has now been added to it.
-- Null means still waiting, which is what the admin home page lists.
ALTER TABLE "Visitor" ADD COLUMN IF NOT EXISTS "whatsappAddedAt" TIMESTAMP(3);
ALTER TABLE "Visitor" ADD COLUMN IF NOT EXISTS "whatsappAddedBy" TEXT;

-- Repair. These five columns belong to migrations already recorded as applied
-- (20260915000000_email_settings_greeting, 20260916000000_per_email_greeting,
-- 20260916100000_service_absentee_mail) but were missing from the production
-- database when it was checked on 16 Sep 2026: the API logs "The column
-- EmailSettings.greeting does not exist" at every start, and the absentee mail
-- job cannot claim a service. Re-stating them is idempotent and repairs that
-- database without touching one where they already exist.
ALTER TABLE "EmailSettings" ADD COLUMN IF NOT EXISTS "greeting" TEXT;
ALTER TABLE "EmailTemplate" ADD COLUMN IF NOT EXISTS "greeting" TEXT;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "greeting" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "absenteeMailSentAt" TIMESTAMP(3);
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "absenteeMailCount" INTEGER;
