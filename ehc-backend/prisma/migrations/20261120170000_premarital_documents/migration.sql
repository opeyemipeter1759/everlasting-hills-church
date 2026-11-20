-- Pre-marital documents: letters, the couple's upload link and codes, the
-- document checklist and encrypted file records. Files are kept: nothing
-- here or in the app deletes them on a schedule.

-- CreateEnum
CREATE TYPE "CounsellingApplicantRole" AS ENUM ('GROOM', 'BRIDE');

-- CreateEnum
CREATE TYPE "CounsellingLetterKind" AS ENUM ('PARENTAL_CONSENT', 'MEDICAL_SCREENING');

-- CreateEnum
CREATE TYPE "CounsellingTemplateState" AS ENUM ('DRAFT', 'APPROVED');

-- CreateEnum
CREATE TYPE "CounsellingRequirementKind" AS ENUM ('PARENTAL_CONSENT', 'MEDICAL_CERT_GROOM', 'MEDICAL_CERT_BRIDE');

-- CreateEnum
CREATE TYPE "CounsellingRequirementStatus" AS ENUM ('PENDING', 'UPLOADED', 'RECEIVED_IN_PERSON', 'VERIFIED', 'NEEDS_REUPLOAD');

-- CreateEnum
CREATE TYPE "CounsellingReuploadReason" AS ENUM ('UNREADABLE', 'INCOMPLETE', 'WRONG_DOCUMENT', 'OUTSIDE_VALIDITY_WINDOW', 'MISSING_SIGNATURE', 'OTHER');

-- CreateEnum
CREATE TYPE "CounsellingTokenScope" AS ENUM ('ALL', 'GROOM', 'BRIDE');

-- CreateEnum
CREATE TYPE "CounsellingDispatchStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "CounsellingApplication" ADD COLUMN     "applicantRole" "CounsellingApplicantRole";

-- CreateTable
CREATE TABLE "CounsellingDocumentTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "CounsellingLetterKind" NOT NULL,
    "version" INTEGER NOT NULL,
    "body" JSONB NOT NULL,
    "approvalState" "CounsellingTemplateState" NOT NULL DEFAULT 'DRAFT',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CounsellingDocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingAccessToken" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "scope" "CounsellingTokenScope" NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "lastUsedAt" TIMESTAMPTZ(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingOtp" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "codeHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingDocumentRequirement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" "CounsellingRequirementKind" NOT NULL,
    "status" "CounsellingRequirementStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMPTZ(3),
    "receivedInPersonAt" TIMESTAMPTZ(3),
    "receivedById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMPTZ(3),
    "testDate" DATE,
    "reuploadReason" "CounsellingReuploadReason",
    "storageConsentAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingDocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingDocumentFile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "encryptionKeyVersion" INTEGER NOT NULL,
    "wrappedDataKey" BYTEA NOT NULL,
    "uploadedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedViaTokenId" TEXT,
    "supersededAt" TIMESTAMPTZ(3),
    "purgedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CounsellingDocumentFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingDocumentViewToken" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CounsellingDocumentViewToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingDocumentDispatch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "consentTemplateId" TEXT,
    "medicalTemplateId" TEXT,
    "issueDate" DATE NOT NULL,
    "status" "CounsellingDispatchStatus" NOT NULL,
    "resendMessageId" TEXT,
    "requestedById" TEXT,
    "sentAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingDocumentDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingDocumentTemplate_tenantId_kind_version_key" ON "CounsellingDocumentTemplate"("tenantId", "kind", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingAccessToken_tokenHash_key" ON "CounsellingAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "CounsellingOtp_tenantId_tokenId_createdAt_idx" ON "CounsellingOtp"("tenantId", "tokenId", "createdAt");

-- CreateIndex
CREATE INDEX "CounsellingDocumentRequirement_tenantId_status_idx" ON "CounsellingDocumentRequirement"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingDocumentRequirement_tenantId_applicationId_kind_key" ON "CounsellingDocumentRequirement"("tenantId", "applicationId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingDocumentFile_storageKey_key" ON "CounsellingDocumentFile"("storageKey");

-- CreateIndex
CREATE INDEX "CounsellingDocumentFile_tenantId_purgedAt_supersededAt_idx" ON "CounsellingDocumentFile"("tenantId", "purgedAt", "supersededAt");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingDocumentViewToken_tokenHash_key" ON "CounsellingDocumentViewToken"("tokenHash");

-- CreateIndex
CREATE INDEX "CounsellingDocumentViewToken_tenantId_expiresAt_idx" ON "CounsellingDocumentViewToken"("tenantId", "expiresAt");

-- CreateIndex
CREATE INDEX "CounsellingDocumentDispatch_tenantId_applicationId_sentAt_idx" ON "CounsellingDocumentDispatch"("tenantId", "applicationId", "sentAt");

-- AddForeignKey
ALTER TABLE "CounsellingDocumentTemplate" ADD CONSTRAINT "CounsellingDocumentTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingAccessToken" ADD CONSTRAINT "CounsellingAccessToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingAccessToken" ADD CONSTRAINT "CounsellingAccessToken_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CounsellingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingOtp" ADD CONSTRAINT "CounsellingOtp_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingOtp" ADD CONSTRAINT "CounsellingOtp_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "CounsellingAccessToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentRequirement" ADD CONSTRAINT "CounsellingDocumentRequirement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentRequirement" ADD CONSTRAINT "CounsellingDocumentRequirement_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CounsellingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentFile" ADD CONSTRAINT "CounsellingDocumentFile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentFile" ADD CONSTRAINT "CounsellingDocumentFile_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "CounsellingDocumentRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentFile" ADD CONSTRAINT "CounsellingDocumentFile_uploadedViaTokenId_fkey" FOREIGN KEY ("uploadedViaTokenId") REFERENCES "CounsellingAccessToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentViewToken" ADD CONSTRAINT "CounsellingDocumentViewToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentViewToken" ADD CONSTRAINT "CounsellingDocumentViewToken_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "CounsellingDocumentFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentDispatch" ADD CONSTRAINT "CounsellingDocumentDispatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentDispatch" ADD CONSTRAINT "CounsellingDocumentDispatch_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CounsellingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentDispatch" ADD CONSTRAINT "CounsellingDocumentDispatch_consentTemplateId_fkey" FOREIGN KEY ("consentTemplateId") REFERENCES "CounsellingDocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentDispatch" ADD CONSTRAINT "CounsellingDocumentDispatch_medicalTemplateId_fkey" FOREIGN KEY ("medicalTemplateId") REFERENCES "CounsellingDocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- One active version per letter, one live link per person, one current file per document.
CREATE UNIQUE INDEX "CounsellingDocumentTemplate_one_active"
  ON "CounsellingDocumentTemplate" ("tenantId", "kind") WHERE "active";
CREATE UNIQUE INDEX "CounsellingAccessToken_one_live_per_scope"
  ON "CounsellingAccessToken" ("tenantId", "applicationId", "scope") WHERE "revokedAt" IS NULL;
CREATE UNIQUE INDEX "CounsellingDocumentFile_one_current"
  ON "CounsellingDocumentFile" ("requirementId") WHERE "supersededAt" IS NULL AND "purgedAt" IS NULL;

ALTER TABLE "CounsellingDocumentTemplate"
  ADD CONSTRAINT "CounsellingDocumentTemplate_version_positive" CHECK ("version" > 0),
  ADD CONSTRAINT "CounsellingDocumentTemplate_approved_has_date" CHECK (("approvalState" = 'APPROVED') = ("approvedAt" IS NOT NULL));
ALTER TABLE "CounsellingOtp"
  ADD CONSTRAINT "CounsellingOtp_attempts_range" CHECK ("attempts" BETWEEN 0 AND 5);
ALTER TABLE "CounsellingDocumentRequirement"
  ADD CONSTRAINT "CounsellingDocumentRequirement_consent_has_no_medical_fields" CHECK ("kind" <> 'PARENTAL_CONSENT' OR ("testDate" IS NULL AND "storageConsentAt" IS NULL)),
  ADD CONSTRAINT "CounsellingDocumentRequirement_reason_when_reupload" CHECK (("status" = 'NEEDS_REUPLOAD') = ("reuploadReason" IS NOT NULL)),
  ADD CONSTRAINT "CounsellingDocumentRequirement_verified_has_date" CHECK (("status" = 'VERIFIED') = ("verifiedAt" IS NOT NULL));
ALTER TABLE "CounsellingDocumentFile"
  ADD CONSTRAINT "CounsellingDocumentFile_type" CHECK ("mimeType" IN ('application/pdf', 'image/jpeg', 'image/png')),
  ADD CONSTRAINT "CounsellingDocumentFile_size_positive" CHECK ("sizeBytes" > 0);

-- Only the backend's own connection reads these (repo convention: RLS on, no policies).
ALTER TABLE "CounsellingDocumentTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingAccessToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingOtp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingDocumentRequirement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingDocumentFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingDocumentViewToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CounsellingDocumentDispatch" ENABLE ROW LEVEL SECURITY;

-- The application carried over from the old form (the only rows with no
-- privacy acknowledgement): its applicant was the old form's groom. Recorded in
-- the audit log. No documents email is sent to it automatically.
WITH backfilled AS (
  UPDATE "CounsellingApplication" SET "applicantRole" = 'GROOM'
   WHERE "privacyAcknowledgedAt" IS NULL AND "applicantRole" IS NULL
  RETURNING "id", "tenantId"
)
INSERT INTO "AuditLog" ("id", "tenantId", "actorId", "action", "entity", "entityId", "before", "after", "createdAt")
SELECT gen_random_uuid()::text, "tenantId", NULL, 'COUNSELLING_ROLE_BACKFILLED', 'CounsellingApplication', "id", NULL, NULL, now()
  FROM backfilled;
