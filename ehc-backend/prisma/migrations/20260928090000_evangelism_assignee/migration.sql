-- Deploy through prisma migrate deploy only.

-- A leader can ask someone other than the worker to follow a contact up.
ALTER TABLE "EvangelismContact" ADD COLUMN IF NOT EXISTS "assigneeMemberId" TEXT;
CREATE INDEX IF NOT EXISTS "EvangelismContact_assigneeMemberId_idx" ON "EvangelismContact"("assigneeMemberId");
