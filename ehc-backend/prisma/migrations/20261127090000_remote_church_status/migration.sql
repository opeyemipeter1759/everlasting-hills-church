-- Deploy through prisma migrate deploy only.
-- An integrated member can be marked EHC Remote Church (worshipping with the
-- church remotely) by the Integration Team, as they can be marked Away.
-- Additive: no existing row changes.

ALTER TYPE "FirstTimerStatusOverride" ADD VALUE IF NOT EXISTS 'REMOTE';
