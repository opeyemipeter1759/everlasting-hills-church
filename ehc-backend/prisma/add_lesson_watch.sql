-- Targeted addition, same reasoning as add_courses.sql: avoids a full `prisma db push`
-- which would still try to drop the untracked `HomeCell` table.
ALTER TABLE "CourseEnrollment" ADD COLUMN "watchedLessonIds" TEXT[] NOT NULL DEFAULT '{}';
