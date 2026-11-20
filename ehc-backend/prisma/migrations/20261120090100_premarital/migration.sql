-- Deploy through prisma migrate deploy only.
-- Premarital counselling, part 2: the full case model. Replaces the
-- 2026-11-19 PreMaritalApplication table, which holds no rows.
-- Tenant scoping follows the repo convention: every table has tenantId, RLS is
-- on with no policies (Supabase anon/authenticated see nothing), and the API,
-- which bypasses RLS, scopes every query by tenant.

-- CreateEnum
CREATE TYPE "CounsellingStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'ACCEPTED_FOR_COUNSELLING', 'IN_COUNSELLING', 'FINAL_REVIEW', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CounsellingMembership" AS ENUM ('BOTH_MEMBERS', 'ONE_MEMBER', 'NEITHER');

-- CreateEnum
CREATE TYPE "CounsellingContactMethod" AS ENUM ('WHATSAPP', 'PHONE_CALL', 'EMAIL');

-- CreateEnum
CREATE TYPE "CounsellingSessionFormat" AS ENUM ('PHYSICAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "CounsellingSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "CounsellingAttendance" AS ENUM ('UNMARKED', 'BOTH_PRESENT', 'ONE_PRESENT', 'ABSENT');

-- CreateEnum
CREATE TYPE "CounsellingModuleState" AS ENUM ('PROPOSED', 'APPROVED');


-- CreateTable
CREATE TABLE "CounsellingApplication" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "submissionKey" TEXT NOT NULL,
    "submissionHash" TEXT NOT NULL,
    "applicantFirstName" TEXT NOT NULL,
    "applicantLastName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "applicantPhone" TEXT NOT NULL,
    "partnerFirstName" TEXT NOT NULL,
    "partnerLastName" TEXT NOT NULL,
    "partnerEmail" TEXT,
    "partnerPhone" TEXT,
    "partnerConsentToContact" BOOLEAN NOT NULL,
    "membership" "CounsellingMembership" NOT NULL,
    "weddingDate" DATE,
    "preferredContact" "CounsellingContactMethod" NOT NULL,
    "intro" VARCHAR(500),
    "privacyAcknowledgedAt" TIMESTAMPTZ(3),
    "status" "CounsellingStatus" NOT NULL DEFAULT 'SUBMITTED',
    "memberId" TEXT,
    "applicantUserId" TEXT,
    "adminNote" VARCHAR(500),
    "safeguardingFlaggedAt" TIMESTAMPTZ(3),
    "safeguardingFlaggedById" TEXT,
    "archivedAt" TIMESTAMPTZ(3),
    "archivedById" TEXT,
    "submittedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "counsellorProfileId" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CounsellingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingModule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scriptureRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "approvalState" "CounsellingModuleState" NOT NULL DEFAULT 'PROPOSED',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "counsellorProfileId" TEXT NOT NULL,
    "moduleId" TEXT,
    "scheduledAt" TIMESTAMPTZ(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "format" "CounsellingSessionFormat" NOT NULL,
    "location" TEXT,
    "meetingLink" TEXT,
    "status" "CounsellingSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "attendance" "CounsellingAttendance" NOT NULL DEFAULT 'UNMARKED',
    "rescheduledFromId" TEXT,
    "reminderSentAt" TIMESTAMPTZ(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingProgress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "completedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedById" TEXT NOT NULL,

    CONSTRAINT "CounsellingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingStatusEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "CounsellingStatus",
    "toStatus" "CounsellingStatus" NOT NULL,
    "actorProfileId" TEXT,
    "reason" VARCHAR(300),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingApproval" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "approvedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" VARCHAR(300),

    CONSTRAINT "WeddingApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarriageMinistryAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MarriageMinistryAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingNotificationLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "CounsellingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingApplication_referenceCode_key" ON "CounsellingApplication"("referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingApplication_tenantId_submissionKey_key" ON "CounsellingApplication"("tenantId", "submissionKey");

-- CreateIndex
CREATE INDEX "CounsellingModule_tenantId_active_sortOrder_idx" ON "CounsellingModule"("tenantId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "CounsellingSession_applicationId_scheduledAt_idx" ON "CounsellingSession"("applicationId", "scheduledAt");

-- CreateIndex
CREATE INDEX "CounsellingSession_tenantId_counsellorProfileId_scheduledAt_idx" ON "CounsellingSession"("tenantId", "counsellorProfileId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingProgress_applicationId_moduleId_key" ON "CounsellingProgress"("applicationId", "moduleId");

-- CreateIndex
CREATE INDEX "CounsellingStatusEvent_applicationId_createdAt_idx" ON "CounsellingStatusEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingApproval_applicationId_key" ON "WeddingApproval"("applicationId");

-- CreateIndex
CREATE INDEX "MarriageMinistryAssignment_tenantId_idx" ON "MarriageMinistryAssignment"("tenantId");

-- CreateIndex
CREATE INDEX "CounsellingNotificationLog_tenantId_sentAt_idx" ON "CounsellingNotificationLog"("tenantId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingSettings_tenantId_key" ON "CounsellingSettings"("tenantId");

-- AddForeignKey
ALTER TABLE "CounsellingApplication" ADD CONSTRAINT "CounsellingApplication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingApplication" ADD CONSTRAINT "CounsellingApplication_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingApplication" ADD CONSTRAINT "CounsellingApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingAssignment" ADD CONSTRAINT "CounsellingAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingAssignment" ADD CONSTRAINT "CounsellingAssignment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CounsellingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingAssignment" ADD CONSTRAINT "CounsellingAssignment_counsellorProfileId_fkey" FOREIGN KEY ("counsellorProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingModule" ADD CONSTRAINT "CounsellingModule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingSession" ADD CONSTRAINT "CounsellingSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingSession" ADD CONSTRAINT "CounsellingSession_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CounsellingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingSession" ADD CONSTRAINT "CounsellingSession_counsellorProfileId_fkey" FOREIGN KEY ("counsellorProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingSession" ADD CONSTRAINT "CounsellingSession_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CounsellingModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingSession" ADD CONSTRAINT "CounsellingSession_rescheduledFromId_fkey" FOREIGN KEY ("rescheduledFromId") REFERENCES "CounsellingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingProgress" ADD CONSTRAINT "CounsellingProgress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingProgress" ADD CONSTRAINT "CounsellingProgress_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CounsellingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingProgress" ADD CONSTRAINT "CounsellingProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CounsellingModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingStatusEvent" ADD CONSTRAINT "CounsellingStatusEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingStatusEvent" ADD CONSTRAINT "CounsellingStatusEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CounsellingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingApproval" ADD CONSTRAINT "WeddingApproval_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingApproval" ADD CONSTRAINT "WeddingApproval_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CounsellingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarriageMinistryAssignment" ADD CONSTRAINT "MarriageMinistryAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarriageMinistryAssignment" ADD CONSTRAINT "MarriageMinistryAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingNotificationLog" ADD CONSTRAINT "CounsellingNotificationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingNotificationLog" ADD CONSTRAINT "CounsellingNotificationLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CounsellingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingSettings" ADD CONSTRAINT "CounsellingSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Partial indexes Prisma cannot express.
CREATE UNIQUE INDEX "CounsellingApplication_open_hash_key" ON "CounsellingApplication"("tenantId", "submissionHash")
  WHERE "status" NOT IN ('COMPLETED', 'CLOSED') AND "archivedAt" IS NULL;
CREATE INDEX "CounsellingApplication_tenantId_status_submittedAt_idx" ON "CounsellingApplication"("tenantId", "status", "submittedAt" DESC)
  WHERE "archivedAt" IS NULL;
CREATE UNIQUE INDEX "CounsellingAssignment_one_active_lead" ON "CounsellingAssignment"("applicationId") WHERE "active" AND "isLead";
CREATE UNIQUE INDEX "CounsellingAssignment_one_active_per_counsellor" ON "CounsellingAssignment"("applicationId", "counsellorProfileId") WHERE "active";
CREATE INDEX "CounsellingAssignment_tenantId_counsellor_idx" ON "CounsellingAssignment"("tenantId", "counsellorProfileId") WHERE "active";
CREATE INDEX "CounsellingSession_tenantId_scheduledAt_idx" ON "CounsellingSession"("tenantId", "scheduledAt") WHERE "status" = 'SCHEDULED';
CREATE UNIQUE INDEX "MarriageMinistryAssignment_active_uq" ON "MarriageMinistryAssignment"("userId") WHERE "endedAt" IS NULL;

-- Checks.
ALTER TABLE "CounsellingApplication" ADD CONSTRAINT "CounsellingApplication_partner_contact"
  CHECK ("partnerEmail" IS NOT NULL OR "partnerPhone" IS NOT NULL);
ALTER TABLE "CounsellingApplication" ADD CONSTRAINT "CounsellingApplication_partner_consent"
  CHECK ("partnerConsentToContact");
ALTER TABLE "CounsellingSession" ADD CONSTRAINT "CounsellingSession_where"
  CHECK (("format" = 'PHYSICAL' AND "location" IS NOT NULL) OR ("format" = 'ONLINE' AND "meetingLink" IS NOT NULL));

-- Append only: status history, and the counselling rows in AuditLog. A
-- documented manual purge (retention) sets ehc.allow_append_only_purge = 'on'
-- for its own transaction; nothing in the app does.
CREATE OR REPLACE FUNCTION counselling_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF coalesce(current_setting('ehc.allow_append_only_purge', true), '') = 'on' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'append-only: % rows cannot be changed or deleted', TG_TABLE_NAME;
END $$;

CREATE TRIGGER "CounsellingStatusEvent_append_only" BEFORE UPDATE OR DELETE ON "CounsellingStatusEvent"
  FOR EACH ROW EXECUTE FUNCTION counselling_append_only();
CREATE TRIGGER "AuditLog_counselling_append_only" BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW WHEN (OLD."entity" LIKE 'Counselling%' OR OLD."entity" = 'WeddingApproval')
  EXECUTE FUNCTION counselling_append_only();

ALTER TABLE "CounsellingApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingModule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingStatusEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeddingApproval" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarriageMinistryAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingNotificationLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingSettings" ENABLE ROW LEVEL SECURITY;

-- Carry over the earlier form's applications. The groom-to-be becomes the
-- applicant and the bride-to-be the partner (that form asked both to agree to
-- be contacted). Preferred contact was not asked, so it is set to a phone
-- call; there was no privacy notice, so privacyAcknowledgedAt stays null. How
-- long they had known each other is kept as their introduction when they left
-- no note. The submission hash matches src/premarital/public-applications.service.ts.
INSERT INTO "CounsellingApplication" (
  "id", "tenantId", "referenceCode", "submissionKey", "submissionHash",
  "applicantFirstName", "applicantLastName", "applicantEmail", "applicantPhone",
  "partnerFirstName", "partnerLastName", "partnerEmail", "partnerPhone", "partnerConsentToContact",
  "membership", "weddingDate", "preferredContact", "intro", "privacyAcknowledgedAt", "status", "submittedAt", "updatedAt"
)
SELECT
  p."id", p."tenantId", p."referenceCode", p."submissionKey",
  encode(sha256(convert_to(concat_ws('|', p."tenantId", lower(trim(p."groomEmail")), right(regexp_replace(p."groomPhone", '\D', '', 'g'), 10),
    lower(trim(p."brideEmail")), right(regexp_replace(p."bridePhone", '\D', '', 'g'), 10)), 'UTF8')), 'hex'),
  p."groomFirstName", p."groomLastName", lower(trim(p."groomEmail")), p."groomPhone",
  p."brideFirstName", p."brideLastName", lower(trim(p."brideEmail")), p."bridePhone", true,
  (CASE WHEN p."groomIsMember" AND p."brideIsMember" THEN 'BOTH_MEMBERS' WHEN p."groomIsMember" OR p."brideIsMember" THEN 'ONE_MEMBER' ELSE 'NEITHER' END)::"CounsellingMembership",
  p."weddingDate", 'PHONE_CALL'::"CounsellingContactMethod",
  COALESCE(left(p."message", 500), CASE p."relationshipLength"
    WHEN 'UNDER_6_MONTHS' THEN 'Known each other: less than 6 months'
    WHEN '6_TO_12_MONTHS' THEN 'Known each other: 6 to 12 months'
    WHEN '1_TO_2_YEARS' THEN 'Known each other: 1 to 2 years'
    WHEN 'OVER_2_YEARS' THEN 'Known each other: more than 2 years' END),
  NULL,
  (CASE p."status" WHEN 'NEW' THEN 'SUBMITTED' WHEN 'IN_REVIEW' THEN 'UNDER_REVIEW' ELSE 'CLOSED' END)::"CounsellingStatus",
  p."submittedAt", now()
FROM "PreMaritalApplication" p;

INSERT INTO "CounsellingStatusEvent" ("id", "tenantId", "applicationId", "fromStatus", "toStatus", "actorProfileId", "reason", "createdAt")
SELECT gen_random_uuid()::text, a."tenantId", a."id", NULL, 'SUBMITTED', NULL, 'Applied on the earlier form', a."submittedAt"
FROM "CounsellingApplication" a JOIN "PreMaritalApplication" p ON p."id" = a."id";
INSERT INTO "CounsellingStatusEvent" ("id", "tenantId", "applicationId", "fromStatus", "toStatus", "actorProfileId", "reason", "createdAt")
SELECT gen_random_uuid()::text, a."tenantId", a."id", 'SUBMITTED', a."status", p."statusUpdatedById", NULL, COALESCE(p."statusUpdatedAt", a."submittedAt")
FROM "CounsellingApplication" a JOIN "PreMaritalApplication" p ON p."id" = a."id"
WHERE a."status" <> 'SUBMITTED';

DROP TABLE "PreMaritalApplication";
DROP TYPE "PreMaritalApplicationStatus";

-- Rollback notes (manual): DROP the triggers and counselling_append_only(); DROP TABLE
-- "CounsellingSettings", "CounsellingNotificationLog", "MarriageMinistryAssignment",
-- "WeddingApproval", "CounsellingStatusEvent", "CounsellingProgress", "CounsellingSession",
-- "CounsellingModule", "CounsellingAssignment", "CounsellingApplication"; DROP the new enum types.
