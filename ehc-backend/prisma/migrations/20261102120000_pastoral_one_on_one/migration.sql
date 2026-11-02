-- Deploy through prisma migrate deploy only.
-- Pastoral One-on-One: pastors (hosts), their weekly hours, days off,
-- session types and delegates, and the requests members and visitors make.
-- New types and tables only; nothing existing is altered. The enums are
-- created here, not added to existing types, so using them in the same file
-- is safe.

-- CreateEnum
CREATE TYPE "PastoralBookingStatus" AS ENUM ('HOLD', 'PENDING', 'PROPOSED', 'APPROVED', 'DECLINED', 'CANCELLED', 'LAPSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PastoralRequesterType" AS ENUM ('MEMBER', 'VISITOR');

-- CreateEnum
CREATE TYPE "PastoralMeetingFormat" AS ENUM ('IN_PERSON', 'GOOGLE_MEET', 'PHONE');

-- CreateTable
CREATE TABLE "PastorHost" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 30,
    "dailyCap" INTEGER NOT NULL DEFAULT 3,
    "minNoticeHours" INTEGER NOT NULL DEFAULT 48,
    "horizonDays" INTEGER NOT NULL DEFAULT 28,
    "visitorsAllowed" BOOLEAN NOT NULL DEFAULT true,
    "visitorWeeklyCap" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PastorHost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastorSessionType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "jointWithHostId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "visitorsCanBook" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PastorSessionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastorAvailabilityRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "PastorAvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastorAvailabilityBlock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,

    CONSTRAINT "PastorAvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastorDelegate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "delegateProfileId" TEXT NOT NULL,
    "appointedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PastorDelegate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastoralBooking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "coHostId" TEXT,
    "sessionTypeId" TEXT NOT NULL,
    "requesterType" "PastoralRequesterType" NOT NULL,
    "memberProfileId" TEXT,
    "visitorId" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterPhone" TEXT,
    "requesterLocation" TEXT,
    "requesterTimezone" TEXT,
    "foundVia" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "PastoralBookingStatus" NOT NULL DEFAULT 'PENDING',
    "holdExpiresAt" TIMESTAMP(3),
    "format" "PastoralMeetingFormat" NOT NULL,
    "topic" TEXT NOT NULL,
    "noteEncrypted" TEXT,
    "proposedStartsAt" TIMESTAMP(3),
    "proposedEndsAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelReason" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "verifyTokenHash" TEXT,
    "manageTokenHash" TEXT,
    "googleEventId" TEXT,
    "meetLink" TEXT,
    "pendingNudgeSentAt" TIMESTAMP(3),
    "reminderDaySentAt" TIMESTAMP(3),
    "reminderHourSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PastoralBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PastorHost_tenantId_profileId_key" ON "PastorHost"("tenantId", "profileId");

-- CreateIndex
CREATE INDEX "PastorSessionType_hostId_idx" ON "PastorSessionType"("hostId");

-- CreateIndex
CREATE INDEX "PastorAvailabilityRule_hostId_idx" ON "PastorAvailabilityRule"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "PastorAvailabilityBlock_hostId_date_key" ON "PastorAvailabilityBlock"("hostId", "date");

-- CreateIndex
CREATE INDEX "PastorDelegate_delegateProfileId_idx" ON "PastorDelegate"("delegateProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "PastorDelegate_hostId_delegateProfileId_key" ON "PastorDelegate"("hostId", "delegateProfileId");

-- CreateIndex
CREATE INDEX "PastoralBooking_hostId_startsAt_idx" ON "PastoralBooking"("hostId", "startsAt");

-- CreateIndex
CREATE INDEX "PastoralBooking_coHostId_startsAt_idx" ON "PastoralBooking"("coHostId", "startsAt");

-- CreateIndex
CREATE INDEX "PastoralBooking_memberProfileId_idx" ON "PastoralBooking"("memberProfileId");

-- CreateIndex
CREATE INDEX "PastoralBooking_requesterEmail_idx" ON "PastoralBooking"("requesterEmail");

-- CreateIndex
CREATE INDEX "PastoralBooking_status_idx" ON "PastoralBooking"("status");

-- AddForeignKey
ALTER TABLE "PastorHost" ADD CONSTRAINT "PastorHost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorHost" ADD CONSTRAINT "PastorHost_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorSessionType" ADD CONSTRAINT "PastorSessionType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorSessionType" ADD CONSTRAINT "PastorSessionType_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "PastorHost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorAvailabilityRule" ADD CONSTRAINT "PastorAvailabilityRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorAvailabilityRule" ADD CONSTRAINT "PastorAvailabilityRule_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "PastorHost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorAvailabilityBlock" ADD CONSTRAINT "PastorAvailabilityBlock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorAvailabilityBlock" ADD CONSTRAINT "PastorAvailabilityBlock_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "PastorHost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorDelegate" ADD CONSTRAINT "PastorDelegate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorDelegate" ADD CONSTRAINT "PastorDelegate_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "PastorHost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorDelegate" ADD CONSTRAINT "PastorDelegate_delegateProfileId_fkey" FOREIGN KEY ("delegateProfileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastoralBooking" ADD CONSTRAINT "PastoralBooking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastoralBooking" ADD CONSTRAINT "PastoralBooking_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "PastorHost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastoralBooking" ADD CONSTRAINT "PastoralBooking_coHostId_fkey" FOREIGN KEY ("coHostId") REFERENCES "PastorHost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastoralBooking" ADD CONSTRAINT "PastoralBooking_sessionTypeId_fkey" FOREIGN KEY ("sessionTypeId") REFERENCES "PastorSessionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastoralBooking" ADD CONSTRAINT "PastoralBooking_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastoralBooking" ADD CONSTRAINT "PastoralBooking_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.3 -> 8.0.0-rc.29                 │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘


-- Rollback notes (manual, only if this migration must be undone):
--   DROP TABLE "PastoralBooking", "PastorDelegate", "PastorAvailabilityBlock",
--     "PastorAvailabilityRule", "PastorSessionType", "PastorHost";
--   DROP TYPE "PastoralBookingStatus", "PastoralRequesterType", "PastoralMeetingFormat";
