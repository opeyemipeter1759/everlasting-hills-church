-- Deploy through prisma migrate deploy only.
-- Service Readiness, Stage 2: two inspections per department per service —
-- the day before, and 2 hours before. New enums and table only.

CREATE TYPE "InspectionRound" AS ENUM ('DAY_BEFORE', 'ON_THE_DAY');
CREATE TYPE "InspectionResult" AS ENUM ('READY', 'ISSUES');

CREATE TABLE "ServiceInspection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "readinessId" TEXT NOT NULL,
    "round" "InspectionRound" NOT NULL,
    "result" "InspectionResult" NOT NULL,
    "checks" JSONB NOT NULL,
    "note" TEXT,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectedById" TEXT,
    CONSTRAINT "ServiceInspection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceInspection_readinessId_round_key" ON "ServiceInspection"("readinessId", "round");

ALTER TABLE "ServiceInspection" ADD CONSTRAINT "ServiceInspection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceInspection" ADD CONSTRAINT "ServiceInspection_readinessId_fkey" FOREIGN KEY ("readinessId") REFERENCES "ServiceReadiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;
