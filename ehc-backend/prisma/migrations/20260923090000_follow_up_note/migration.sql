-- Deploy through prisma migrate deploy only.

-- The team's conversation about one person on the Master List. Keyed by
-- subject, so a first-timer with no follow-up entry can still be discussed.
CREATE TABLE IF NOT EXISTS "FollowUpNote" (
  "id"          TEXT         NOT NULL,
  "tenantId"    TEXT         NOT NULL,
  "subjectKind" TEXT         NOT NULL,
  "subjectId"   TEXT         NOT NULL,
  "authorId"    TEXT         NOT NULL,
  "body"        TEXT         NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "editedAt"    TIMESTAMP(3),
  CONSTRAINT "FollowUpNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FollowUpNote_subject_idx"
  ON "FollowUpNote"("tenantId", "subjectKind", "subjectId", "createdAt");

DO $$
BEGIN
  ALTER TABLE "FollowUpNote"
    ADD CONSTRAINT "FollowUpNote_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
