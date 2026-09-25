-- Somebody telling the church they have given their life to Christ, or come
-- back to Him. Its own table rather than a flag on Visitor: a decision is an
-- event in time the pastoral team responds to, and the person making one may
-- already be a member, a first timer, or nobody the church has ever met.
CREATE TYPE "SalvationDecisionType" AS ENUM ('FIRST_TIME', 'REDEDICATION');

CREATE TABLE "SalvationDecision" (
  "id"                  TEXT NOT NULL,
  "tenantId"            TEXT NOT NULL,
  "firstName"           TEXT NOT NULL,
  "lastName"            TEXT NOT NULL,
  "email"               TEXT,
  "phone"               TEXT,
  "decision"            "SalvationDecisionType" NOT NULL,
  "location"            TEXT,
  "churchName"          TEXT,
  "interestedInBaptism" BOOLEAN,
  "message"             TEXT,
  "eventId"             TEXT,
  "memberId"            TEXT,
  "contactedAt"         TIMESTAMP(3),
  "contactedById"       TEXT,
  "note"                TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SalvationDecision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SalvationDecision_tenantId_createdAt_idx" ON "SalvationDecision"("tenantId", "createdAt");
CREATE INDEX "SalvationDecision_tenantId_contactedAt_idx" ON "SalvationDecision"("tenantId", "contactedAt");
CREATE INDEX "SalvationDecision_eventId_idx" ON "SalvationDecision"("eventId");

ALTER TABLE "SalvationDecision" ADD CONSTRAINT "SalvationDecision_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalvationDecision" ADD CONSTRAINT "SalvationDecision_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalvationDecision" ADD CONSTRAINT "SalvationDecision_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalvationDecision" ADD CONSTRAINT "SalvationDecision_contactedById_fkey"
  FOREIGN KEY ("contactedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
