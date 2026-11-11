-- Deploy through prisma migrate deploy only.
-- Service Readiness: each unit's plan for a service is a list of tasks the
-- unit sets itself; the Administrator can add to it. New table only.

CREATE TABLE "ReadinessTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "readinessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "doneById" TEXT,
    "createdById" TEXT,
    "byAdministrator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadinessTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReadinessTask_readinessId_position_idx" ON "ReadinessTask"("readinessId", "position");

ALTER TABLE "ReadinessTask" ADD CONSTRAINT "ReadinessTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReadinessTask" ADD CONSTRAINT "ReadinessTask_readinessId_fkey" FOREIGN KEY ("readinessId") REFERENCES "ServiceReadiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;
