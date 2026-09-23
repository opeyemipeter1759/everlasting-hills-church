-- Deploy through prisma migrate deploy only.

-- Requests to change how someone reads on the Follow Up Master List. Anyone on
-- the team may ask; a unit lead or head of department approves, and the latest
-- approved row is what the list shows. IF NOT EXISTS so re-running is safe.
CREATE TABLE IF NOT EXISTS "FollowUpStatusChange" (
  "id"            TEXT         NOT NULL,
  "tenantId"      TEXT         NOT NULL,
  "subjectKind"   TEXT         NOT NULL,
  "subjectId"     TEXT         NOT NULL,
  "fromStatus"    TEXT         NOT NULL,
  "toStatus"      TEXT         NOT NULL,
  "state"         TEXT         NOT NULL DEFAULT 'PENDING',
  "note"          TEXT,
  "requestedById" TEXT         NOT NULL,
  "requestedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedById"   TEXT,
  "decidedAt"     TIMESTAMP(3),
  CONSTRAINT "FollowUpStatusChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FollowUpStatusChange_tenantId_state_idx"
  ON "FollowUpStatusChange"("tenantId", "state");
CREATE INDEX IF NOT EXISTS "FollowUpStatusChange_tenant_subject_state_idx"
  ON "FollowUpStatusChange"("tenantId", "subjectKind", "subjectId", "state");

DO $$
BEGIN
  ALTER TABLE "FollowUpStatusChange"
    ADD CONSTRAINT "FollowUpStatusChange_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
