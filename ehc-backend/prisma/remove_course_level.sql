-- Targeted removal, same reasoning as add_courses.sql: avoids a full `prisma db push`
-- which would still try to drop the untracked `HomeCell` table.
ALTER TABLE "Course" DROP COLUMN IF EXISTS "level";
DROP TYPE IF EXISTS "CourseLevel";
