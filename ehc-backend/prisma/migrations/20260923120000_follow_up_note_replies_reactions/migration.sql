-- Deploy through prisma migrate deploy only.

-- Replies: a message may answer another one.
ALTER TABLE "FollowUpNote" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
CREATE INDEX IF NOT EXISTS "FollowUpNote_parentId_idx" ON "FollowUpNote"("parentId");

DO $$
BEGIN
  ALTER TABLE "FollowUpNote"
    ADD CONSTRAINT "FollowUpNote_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "FollowUpNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Reactions: one row per person per emoji per message, so a second tap of the
-- same emoji removes it instead of stacking.
CREATE TABLE IF NOT EXISTS "FollowUpNoteReaction" (
  "id"        TEXT         NOT NULL,
  "tenantId"  TEXT         NOT NULL,
  "noteId"    TEXT         NOT NULL,
  "profileId" TEXT         NOT NULL,
  "emoji"     TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FollowUpNoteReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FollowUpNoteReaction_once"
  ON "FollowUpNoteReaction"("noteId", "profileId", "emoji");
CREATE INDEX IF NOT EXISTS "FollowUpNoteReaction_noteId_idx" ON "FollowUpNoteReaction"("noteId");

DO $$
BEGIN
  ALTER TABLE "FollowUpNoteReaction"
    ADD CONSTRAINT "FollowUpNoteReaction_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "FollowUpNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "FollowUpNoteReaction"
    ADD CONSTRAINT "FollowUpNoteReaction_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
