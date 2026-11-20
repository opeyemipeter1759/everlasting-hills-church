-- Deploy through prisma migrate deploy only.
-- Premarital counselling, part 1: the Marriage ministry role. Postgres cannot
-- use an enum value in the transaction that adds it, so it ships on its own.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MARRIAGE_MINISTRY' BEFORE 'MEMBER';

-- Rollback notes (manual): Postgres cannot drop an enum value. Leave it in place.
