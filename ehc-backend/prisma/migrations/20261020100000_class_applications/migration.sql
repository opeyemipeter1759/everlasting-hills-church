-- Deploy through prisma migrate deploy only.
-- Class applications: joining a class is applied for and approved by a Super Admin,
-- Pastor or Admin Head. Adds the two new enrollment states and who decided, when and why.
-- Additive only: existing enrollments keep the state they have.

ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'DECLINED';

ALTER TABLE "CourseEnrollment"
  ADD COLUMN IF NOT EXISTS "decidedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "decidedById" TEXT,
  ADD COLUMN IF NOT EXISTS "decisionNote" TEXT;
