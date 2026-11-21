-- Couple dashboard (2026-11-21). Each partner signs in to follow the
-- application, the sessions and the materials, and to upload documents.
-- Members use their usual account; anyone else gets a sign-in made only for
-- the dashboard. This replaces the emailed link and six-digit code, so the
-- link tables go. They were emptied with the test applications on 2026-11-20;
-- the check below stops the migration rather than drop anything real.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "CounsellingAccessToken") OR EXISTS (SELECT 1 FROM "CounsellingOtp")
     OR EXISTS (SELECT 1 FROM "CounsellingDocumentFile" WHERE "uploadedViaTokenId" IS NOT NULL) THEN
    RAISE EXCEPTION 'couple accounts migration: document links are still in use; stop and review';
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "CounsellingParticipantSide" AS ENUM ('APPLICANT', 'PARTNER');

-- CreateEnum
CREATE TYPE "CounsellingAccountKind" AS ENUM ('MEMBER', 'COUPLE');

-- DropForeignKey
ALTER TABLE "CounsellingAccessToken" DROP CONSTRAINT "CounsellingAccessToken_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "CounsellingAccessToken" DROP CONSTRAINT "CounsellingAccessToken_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "CounsellingDocumentFile" DROP CONSTRAINT "CounsellingDocumentFile_uploadedViaTokenId_fkey";

-- DropForeignKey
ALTER TABLE "CounsellingOtp" DROP CONSTRAINT "CounsellingOtp_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "CounsellingOtp" DROP CONSTRAINT "CounsellingOtp_tokenId_fkey";

-- AlterTable
ALTER TABLE "CounsellingDocumentFile" DROP COLUMN "uploadedViaTokenId",
ADD COLUMN     "uploadedByParticipantId" TEXT;

-- DropTable
DROP TABLE "CounsellingAccessToken";

-- DropTable
DROP TABLE "CounsellingOtp";

-- DropEnum
DROP TYPE "CounsellingTokenScope";

-- CreateTable
CREATE TABLE "CounsellingParticipant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "side" "CounsellingParticipantSide" NOT NULL,
    "authUserId" TEXT NOT NULL,
    "accountKind" "CounsellingAccountKind" NOT NULL,
    "signInSentAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CounsellingParticipant_tenantId_authUserId_idx" ON "CounsellingParticipant"("tenantId", "authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingParticipant_applicationId_side_key" ON "CounsellingParticipant"("applicationId", "side");

-- AddForeignKey
ALTER TABLE "CounsellingParticipant" ADD CONSTRAINT "CounsellingParticipant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingParticipant" ADD CONSTRAINT "CounsellingParticipant_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CounsellingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDocumentFile" ADD CONSTRAINT "CounsellingDocumentFile_uploadedByParticipantId_fkey" FOREIGN KEY ("uploadedByParticipantId") REFERENCES "CounsellingParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE "CounsellingParticipant" ENABLE ROW LEVEL SECURITY;
