-- Deploy through prisma migrate deploy only.
-- Adds the PENDING value to PrayerSignupStatus on its own: Postgres will not
-- let a new enum value be used in the same transaction that creates it, so
-- everything that uses PENDING lives in the next migration instead.

ALTER TYPE "PrayerSignupStatus" ADD VALUE IF NOT EXISTS 'PENDING';
