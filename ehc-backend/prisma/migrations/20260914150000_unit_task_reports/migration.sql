-- CreateEnum
CREATE TYPE "UnitTaskReportOutcome" AS ENUM ('COMPLETED', 'IN_PROGRESS', 'BLOCKED');

-- CreateEnum
CREATE TYPE "UnitTaskReportStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'NEEDS_REVISION');

-- CreateTable
CREATE TABLE "UnitTaskReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "outcome" "UnitTaskReportOutcome" NOT NULL,
    "summary" TEXT NOT NULL,
    "challenges" TEXT,
    "nextSteps" TEXT,
    "status" "UnitTaskReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitTaskReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnitTaskReport_taskId_createdAt_idx" ON "UnitTaskReport"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "UnitTaskReport_authorId_idx" ON "UnitTaskReport"("authorId");

-- AddForeignKey
ALTER TABLE "UnitTaskReport" ADD CONSTRAINT "UnitTaskReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitTaskReport" ADD CONSTRAINT "UnitTaskReport_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "UnitTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitTaskReport" ADD CONSTRAINT "UnitTaskReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitTaskReport" ADD CONSTRAINT "UnitTaskReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
