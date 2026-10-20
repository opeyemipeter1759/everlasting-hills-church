-- Deploy through prisma migrate deploy only.
-- The application form for joining a class: what the member wrote, kept on the enrollment
-- for the Super Admin, Pastor or Admin Head who decides. Additive only.

ALTER TABLE "CourseEnrollment"
  ADD COLUMN IF NOT EXISTS "applicationAnswers" JSONB;
