-- Deploy through prisma migrate deploy only.
-- Service Readiness, phase 1: which departments serve on Sunday / Wednesday,
-- and each department's inspection checklist per service type.
-- Two defaulted columns and one new table; nothing existing changes.

ALTER TABLE "Unit" ADD COLUMN "readinessSunday" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Unit" ADD COLUMN "readinessWednesday" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ReadinessChecklistItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadinessChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReadinessChecklistItem_unitId_serviceType_position_idx" ON "ReadinessChecklistItem"("unitId", "serviceType", "position");

ALTER TABLE "ReadinessChecklistItem" ADD CONSTRAINT "ReadinessChecklistItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReadinessChecklistItem" ADD CONSTRAINT "ReadinessChecklistItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
