-- Deploy through prisma migrate deploy only.
-- Service Readiness: the Administrator approves each unit's plan, and units
-- post updates on it (everything ready, or a blocker). New columns, enum and
-- table only; nothing existing changes.

CREATE TYPE "ReadinessStatus" AS ENUM ('READY', 'BLOCKED');

ALTER TABLE "ServiceReadiness" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "ServiceReadiness" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "ServiceReadiness" ADD COLUMN "status" "ReadinessStatus";
ALTER TABLE "ServiceReadiness" ADD COLUMN "blocker" TEXT;
ALTER TABLE "ServiceReadiness" ADD COLUMN "statusUpdatedAt" TIMESTAMP(3);

CREATE TABLE "ReadinessUpdate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "readinessId" TEXT NOT NULL,
    "status" "ReadinessStatus" NOT NULL,
    "note" TEXT,
    "byId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadinessUpdate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReadinessUpdate_readinessId_createdAt_idx" ON "ReadinessUpdate"("readinessId", "createdAt");

ALTER TABLE "ReadinessUpdate" ADD CONSTRAINT "ReadinessUpdate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReadinessUpdate" ADD CONSTRAINT "ReadinessUpdate_readinessId_fkey" FOREIGN KEY ("readinessId") REFERENCES "ServiceReadiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;
