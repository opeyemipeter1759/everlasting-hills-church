-- AlterTable: claim marker for the attendance absentee-email job
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "absenteeMailSentAt" TIMESTAMP(3);
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "absenteeMailCount" INTEGER;
