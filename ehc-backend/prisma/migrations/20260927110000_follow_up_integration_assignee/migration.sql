-- Deploy through prisma migrate deploy only.

-- The Integration Team's own assignee, separate from Follow Up's, so the two
-- boards' "Assigned to me" lists stop sharing one slot. Starts empty: every
-- existing assignment (checked 2026-09-27: none were Integration Team
-- members) stays Follow Up's.
ALTER TABLE "FollowUpEntry" ADD COLUMN IF NOT EXISTS "integrationAssigneeId" TEXT;
CREATE INDEX IF NOT EXISTS "FollowUpEntry_integrationAssigneeId_idx" ON "FollowUpEntry"("integrationAssigneeId");

DO $$
BEGIN
  ALTER TABLE "FollowUpEntry"
    ADD CONSTRAINT "FollowUpEntry_integrationAssigneeId_fkey"
    FOREIGN KEY ("integrationAssigneeId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
