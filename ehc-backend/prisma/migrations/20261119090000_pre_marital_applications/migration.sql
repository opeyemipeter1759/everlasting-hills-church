-- Deploy through prisma migrate deploy only.
-- Pre-marital counselling: couples apply on the public site and pastors review
-- the applications under Pastoral. New enum and table only; nothing existing changes.

CREATE TYPE "PreMaritalApplicationStatus" AS ENUM ('NEW', 'IN_REVIEW', 'CLOSED');

CREATE TABLE "PreMaritalApplication" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "submissionKey" TEXT NOT NULL,
    "groomFirstName" TEXT NOT NULL,
    "groomLastName" TEXT NOT NULL,
    "groomPhone" TEXT NOT NULL,
    "groomEmail" TEXT NOT NULL,
    "groomIsMember" BOOLEAN NOT NULL,
    "brideFirstName" TEXT NOT NULL,
    "brideLastName" TEXT NOT NULL,
    "bridePhone" TEXT NOT NULL,
    "brideEmail" TEXT NOT NULL,
    "brideIsMember" BOOLEAN NOT NULL,
    "weddingDate" DATE,
    "relationshipLength" TEXT,
    "message" TEXT,
    "status" "PreMaritalApplicationStatus" NOT NULL DEFAULT 'NEW',
    "statusUpdatedAt" TIMESTAMP(3),
    "statusUpdatedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PreMaritalApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PreMaritalApplication_referenceCode_key" ON "PreMaritalApplication"("referenceCode");
CREATE UNIQUE INDEX "PreMaritalApplication_tenantId_submissionKey_key" ON "PreMaritalApplication"("tenantId", "submissionKey");
CREATE INDEX "PreMaritalApplication_tenantId_status_submittedAt_idx" ON "PreMaritalApplication"("tenantId", "status", "submittedAt");

ALTER TABLE "PreMaritalApplication" ADD CONSTRAINT "PreMaritalApplication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
