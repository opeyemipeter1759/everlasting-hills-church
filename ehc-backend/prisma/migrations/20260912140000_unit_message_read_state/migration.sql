-- AlterTable
ALTER TABLE "UnitMessage" ADD COLUMN "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "UnitMessage_unitId_recipientId_readAt_idx" ON "UnitMessage"("unitId", "recipientId", "readAt");
