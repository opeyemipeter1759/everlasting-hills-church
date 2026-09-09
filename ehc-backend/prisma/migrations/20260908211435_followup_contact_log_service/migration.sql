-- AlterTable
ALTER TABLE "FollowUpContactLog" ADD COLUMN "serviceId" TEXT;

-- CreateIndex
CREATE INDEX "FollowUpContactLog_serviceId_idx" ON "FollowUpContactLog"("serviceId");

-- AddForeignKey
ALTER TABLE "FollowUpContactLog" ADD CONSTRAINT "FollowUpContactLog_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
