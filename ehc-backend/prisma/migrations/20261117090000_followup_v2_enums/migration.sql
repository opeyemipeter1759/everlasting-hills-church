-- Deploy through prisma migrate deploy only.
-- Follow-up v2, part 1: new enum values. Postgres cannot use an enum value in
-- the transaction that adds it, so these ship on their own, before part 2.
ALTER TYPE "FollowUpStage" ADD VALUE IF NOT EXISTS 'OPTED_OUT';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FIRST_TIMER_CONTACT' BEFORE 'MEMBER';

-- Rollback notes (manual): Postgres cannot drop an enum value. Leave them in place.
