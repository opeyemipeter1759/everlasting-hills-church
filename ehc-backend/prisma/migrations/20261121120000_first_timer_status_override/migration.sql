-- A first-timer's status set by hand on the Follow Up board. Nullable and
-- additive: existing rows keep following their visits.
CREATE TYPE "FirstTimerStatusOverride" AS ENUM ('FIRST_TIMER', 'SECOND_TIMER', 'THIRD_TIMER', 'FOURTH_TIMER', 'AWAY');

ALTER TABLE "Visitor"
  ADD COLUMN "statusOverride" "FirstTimerStatusOverride",
  ADD COLUMN "statusOverrideAt" TIMESTAMPTZ(3),
  ADD COLUMN "statusOverrideById" TEXT;
