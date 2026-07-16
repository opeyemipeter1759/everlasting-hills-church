-- Targeted addition, same reasoning as add_courses.sql: avoids a full `prisma db push`
-- which would still try to drop the untracked `HomeCell` table.
ALTER TYPE "MemberStatus" ADD VALUE IF NOT EXISTS 'OPTED_OUT';
