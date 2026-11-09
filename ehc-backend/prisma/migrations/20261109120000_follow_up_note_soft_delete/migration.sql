-- Deploy through prisma migrate deploy only.
-- Deleting a follow-up message used to remove the row, and the reply relation
-- cascades, so every reply under it went too. Messages are now soft-deleted:
-- the row (and its replies) stay, the text is cleared, and these record when
-- and by whom.
ALTER TABLE "FollowUpNote" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "FollowUpNote" ADD COLUMN "deletedById" TEXT;
