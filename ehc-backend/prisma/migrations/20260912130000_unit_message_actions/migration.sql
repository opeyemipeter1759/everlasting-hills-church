-- AlterTable
ALTER TABLE "UnitMessage"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "editedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "replyToId" TEXT;

-- AddForeignKey
ALTER TABLE "UnitMessage"
  ADD CONSTRAINT "UnitMessage_replyToId_fkey"
  FOREIGN KEY ("replyToId") REFERENCES "UnitMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "UnitMessage_replyToId_idx" ON "UnitMessage"("replyToId");
