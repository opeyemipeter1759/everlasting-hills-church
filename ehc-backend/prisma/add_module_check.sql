-- Targeted addition, same reasoning as add_courses.sql: avoids a full `prisma db push`
-- which would still try to drop the untracked `HomeCell` table.
ALTER TABLE "CourseModule" ADD COLUMN "checkQuestion" TEXT;
ALTER TABLE "CourseModule" ADD COLUMN "checkOptions" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "CourseModule" ADD COLUMN "checkCorrectIndex" INTEGER;
ALTER TABLE "CourseEnrollment" ADD COLUMN "passedModuleIds" TEXT[] NOT NULL DEFAULT '{}';
