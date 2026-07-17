-- Targeted addition, same reasoning as add_courses.sql: avoids a full `prisma db push`
-- which would still try to drop the untracked `HomeCell` table.
ALTER TYPE "FollowUpOutcome" ADD VALUE IF NOT EXISTS 'REACHABLE';
ALTER TYPE "FollowUpOutcome" ADD VALUE IF NOT EXISTS 'TRAVEL';
ALTER TYPE "FollowUpOutcome" ADD VALUE IF NOT EXISTS 'CAME_FOR_VISITING';
ALTER TYPE "FollowUpOutcome" ADD VALUE IF NOT EXISTS 'HAVE_A_CHURCH';
ALTER TYPE "FollowUpOutcome" ADD VALUE IF NOT EXISTS 'WANT_TO_BE_MEMBER';
