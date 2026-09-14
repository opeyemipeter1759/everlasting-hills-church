-- Members may read different personal plans simultaneously. Retain every
-- subscription and its progress; only duplicate ACTIVE readings of the same
-- plan are prevented. Anchored church-wide readings remain a separate scope.
--
-- Deploy with prisma migrate deploy before releasing the updated API.
-- Install the replacement before removing the legacy restriction so a failed
-- uniqueness check leaves the existing protection in place.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS "MemberPlanSubscription_active_personal_plan"
  ON "MemberPlanSubscription" ("tenantId", "profileId", "planId")
  WHERE "status" = 'ACTIVE' AND "anchorDate" IS NULL;

DROP INDEX IF EXISTS "MemberPlanSubscription_one_active_personal";

COMMIT;
