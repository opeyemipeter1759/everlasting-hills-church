-- Deploy through prisma migrate deploy only.
-- The pastor now decides how a session happens (in person, video or phone)
-- when approving it or suggesting a time, so a new request has no format yet.

ALTER TABLE "PastoralBooking" ALTER COLUMN "format" DROP NOT NULL;

-- Rollback notes (manual):
--   fill format on every row first, then ALTER COLUMN "format" SET NOT NULL.
