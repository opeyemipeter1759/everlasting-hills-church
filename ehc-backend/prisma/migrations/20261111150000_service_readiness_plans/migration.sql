-- Deploy through prisma migrate deploy only.
-- Service Readiness, phase 2: each department's Stage 1 plan for each service.
-- New enum and table only; nothing existing changes.

CREATE TYPE "ReadinessState" AS ENUM ('NOT_STARTED', 'CONFIRMED', 'AT_RISK');

CREATE TABLE "ServiceReadiness" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "state" "ReadinessState" NOT NULL DEFAULT 'NOT_STARTED',
    "workers" TEXT,
    "equipment" TEXT,
    "done" TEXT,
    "outstanding" TEXT,
    "challenges" TEXT,
    "support" TEXT,
    "canMeetDeadline" BOOLEAN,
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "remindedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceReadiness_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceReadiness_serviceId_unitId_key" ON "ServiceReadiness"("serviceId", "unitId");
CREATE INDEX "ServiceReadiness_tenantId_state_idx" ON "ServiceReadiness"("tenantId", "state");

ALTER TABLE "ServiceReadiness" ADD CONSTRAINT "ServiceReadiness_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceReadiness" ADD CONSTRAINT "ServiceReadiness_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceReadiness" ADD CONSTRAINT "ServiceReadiness_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
