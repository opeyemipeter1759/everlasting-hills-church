-- DropIndex
DROP INDEX "FollowUpEntry_unitId_memberId_key";

-- DropIndex
DROP INDEX "FollowUpEntry_unitId_visitorId_key";

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpEntry_memberId_key" ON "FollowUpEntry"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpEntry_visitorId_key" ON "FollowUpEntry"("visitorId");
