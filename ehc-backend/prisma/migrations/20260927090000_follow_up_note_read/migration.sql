-- Deploy through prisma migrate deploy only.

-- When each team member last opened a person's activity thread, so the
-- Master List can show who has unread messages.
CREATE TABLE IF NOT EXISTS "FollowUpNoteRead" (
  "id"          TEXT         NOT NULL,
  "tenantId"    TEXT         NOT NULL,
  "profileId"   TEXT         NOT NULL,
  "subjectKind" TEXT         NOT NULL,
  "subjectId"   TEXT         NOT NULL,
  "lastReadAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FollowUpNoteRead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FollowUpNoteRead_profileId_subjectKind_subjectId_key"
  ON "FollowUpNoteRead"("profileId", "subjectKind", "subjectId");
CREATE INDEX IF NOT EXISTS "FollowUpNoteRead_tenantId_profileId_idx" ON "FollowUpNoteRead"("tenantId", "profileId");

DO $$
BEGIN
  ALTER TABLE "FollowUpNoteRead"
    ADD CONSTRAINT "FollowUpNoteRead_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
