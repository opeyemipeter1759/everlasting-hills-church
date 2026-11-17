-- Deploy through prisma migrate deploy only.
-- Follow-up v2, part 2: first-timer visits, stage history, routing rules,
-- generic approvals, the notification outbox, message templates and their log,
-- the first-timer contact role, and new columns on Visitor, FollowUpEntry,
-- Notification and NotificationPreference. Additive only: nothing existing is
-- dropped or rewritten here; the data backfills are separate scripts.

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "FollowUpEntry" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "firstContactedAt" TIMESTAMP(3),
ADD COLUMN     "routingRuleId" TEXT;

-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" TEXT,
ADD COLUMN     "firstVisitDate" DATE,
ADD COLUMN     "heardFromOther" TEXT,
ADD COLUMN     "isStudent" BOOLEAN,
ADD COLUMN     "photoConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "photoConsentAt" TIMESTAMP(3),
ADD COLUMN     "photoKey" TEXT,
ADD COLUMN     "possibleReturnMemberId" TEXT,
ADD COLUMN     "possibleReturnResolvedAt" TIMESTAMP(3),
ADD COLUMN     "possibleReturnVisitorId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'in_app',
ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "payload" JSONB;

-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN     "followUpUpdates" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "FirstTimerVisit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "visitedOn" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirstTimerVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpStageHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "fromStage" "FollowUpStage",
    "toStage" "FollowUpStage" NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUpStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT 'LEAST_LOADED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingRuleMember" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "RoutingRuleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requesterId" TEXT NOT NULL,
    "note" TEXT,
    "deciderId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "adminOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "actorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt" TIMESTAMP(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "whatsappBody" TEXT NOT NULL,
    "emailSubject" TEXT NOT NULL,
    "emailBody" TEXT NOT NULL,
    "editedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "sentById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirstTimerContactAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "FirstTimerContactAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FirstTimerVisit_tenantId_visitedOn_idx" ON "FirstTimerVisit"("tenantId", "visitedOn");

-- CreateIndex
CREATE UNIQUE INDEX "FirstTimerVisit_visitorId_visitedOn_key" ON "FirstTimerVisit"("visitorId", "visitedOn");

-- CreateIndex
CREATE INDEX "FollowUpStageHistory_entryId_createdAt_idx" ON "FollowUpStageHistory"("entryId", "createdAt");

-- CreateIndex
CREATE INDEX "FollowUpStageHistory_tenantId_createdAt_idx" ON "FollowUpStageHistory"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "RoutingRule_tenantId_active_idx" ON "RoutingRule"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "RoutingRuleMember_ruleId_memberId_key" ON "RoutingRuleMember"("ruleId", "memberId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_tenantId_unitId_status_idx" ON "ApprovalRequest"("tenantId", "unitId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_subjectType_subjectId_idx" ON "ApprovalRequest"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_nextAttemptAt_idx" ON "OutboxEvent"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_tenantId_createdAt_idx" ON "OutboxEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageTemplate_tenantId_key_idx" ON "MessageTemplate"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_tenantId_key_version_key" ON "MessageTemplate"("tenantId", "key", "version");

-- CreateIndex
CREATE INDEX "MessageLog_tenantId_visitorId_idx" ON "MessageLog"("tenantId", "visitorId");

-- CreateIndex
CREATE INDEX "MessageLog_tenantId_sentAt_idx" ON "MessageLog"("tenantId", "sentAt");

-- CreateIndex
CREATE INDEX "FirstTimerContactAssignment_tenantId_idx" ON "FirstTimerContactAssignment"("tenantId");

-- CreateIndex
CREATE INDEX "FirstTimerContactAssignment_userId_idx" ON "FirstTimerContactAssignment"("userId");

-- CreateIndex
CREATE INDEX "Visitor_tenantId_firstVisitDate_idx" ON "Visitor"("tenantId", "firstVisitDate");

-- CreateIndex
CREATE INDEX "Notification_profileId_readAt_createdAt_idx" ON "Notification"("profileId", "readAt", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "FirstTimerVisit" ADD CONSTRAINT "FirstTimerVisit_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingRuleMember" ADD CONSTRAINT "RoutingRuleMember_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RoutingRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- One active first-timer contact assignment per person.
CREATE UNIQUE INDEX IF NOT EXISTS "FirstTimerContactAssignment_active_uq"
  ON "FirstTimerContactAssignment"("userId") WHERE "endedAt" IS NULL;

-- At most one pending approval of each kind per subject.
CREATE UNIQUE INDEX IF NOT EXISTS "ApprovalRequest_pending_uq"
  ON "ApprovalRequest"("kind", "subjectType", "subjectId") WHERE "status" = 'PENDING';

-- Retries of one event never notify the same person twice on one channel.
CREATE UNIQUE INDEX IF NOT EXISTS "Notification_event_recipient_channel_uq"
  ON "Notification"("eventId", "profileId", "channel") WHERE "eventId" IS NOT NULL;

-- Open assignments per assignee: what least-loaded routing counts.
CREATE INDEX IF NOT EXISTS "FollowUpEntry_tenantId_assigneeId_idx"
  ON "FollowUpEntry"("tenantId", "assigneeId") WHERE "assigneeId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "FollowUpEntry_tenantId_stage_idx" ON "FollowUpEntry"("tenantId", "stage");

-- Row level security: enabled with no policies, so the anon and authenticated
-- roles see nothing. The API connects as a role that bypasses RLS and scopes
-- by tenant itself, the same convention as the other tables.
ALTER TABLE "FirstTimerVisit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FollowUpStageHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoutingRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoutingRuleMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApprovalRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OutboxEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MessageTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MessageLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FirstTimerContactAssignment" ENABLE ROW LEVEL SECURITY;

-- Rollback notes (manual): DROP TABLE "FirstTimerVisit", "FollowUpStageHistory",
-- "RoutingRuleMember", "RoutingRule", "ApprovalRequest", "OutboxEvent",
-- "MessageTemplate", "MessageLog", "FirstTimerContactAssignment"; DROP TYPE
-- "ApprovalStatus"; and drop the added columns and indexes listed above.
