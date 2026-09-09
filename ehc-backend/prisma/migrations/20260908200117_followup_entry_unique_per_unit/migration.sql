-- CreateIndex
CREATE UNIQUE INDEX "FollowUpEntry_unitId_memberId_key" ON "FollowUpEntry"("unitId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpEntry_unitId_visitorId_key" ON "FollowUpEntry"("unitId", "visitorId");
