-- Deploy through prisma migrate deploy only.

-- Evangelism Team: outreaches, contacts and their 30-day follow-up, tasks,
-- testimonies. New tables only.
-- CreateTable
CREATE TABLE IF NOT EXISTS "EvangelismOutreach" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvangelismOutreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EvangelismOutreachWorker" (
    "id" TEXT NOT NULL,
    "outreachId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "EvangelismOutreachWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EvangelismContact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "savedStatus" TEXT NOT NULL,
    "isStudent" BOOLEAN NOT NULL DEFAULT false,
    "school" TEXT,
    "level" TEXT,
    "discussion" TEXT,
    "workerMemberId" TEXT,
    "workerName" TEXT NOT NULL,
    "outreachId" TEXT,
    "contactDate" TIMESTAMP(3) NOT NULL,
    "nextAction" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "callBackAt" TIMESTAMP(3),
    "lastActionAt" TIMESTAMP(3),
    "windowEndsAt" TIMESTAMP(3) NOT NULL,
    "reviewOutcome" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "invitedAt" TIMESTAMP(3),
    "attendedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'FORM',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvangelismContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EvangelismActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "outcome" TEXT,
    "note" TEXT,
    "statusFrom" TEXT,
    "statusTo" TEXT,
    "happenedAt" TIMESTAMP(3) NOT NULL,
    "actorMemberId" TEXT,
    "actorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvangelismActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EvangelismTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contactId" TEXT,
    "type" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvangelismTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EvangelismTaskAssignee" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "EvangelismTaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EvangelismTaskNote" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorMemberId" TEXT,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvangelismTaskNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EvangelismTestimony" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "contactId" TEXT,
    "outreachId" TEXT,
    "workerMemberId" TEXT,
    "workerName" TEXT,
    "photoUrl" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedByName" TEXT,
    "submittedById" TEXT,
    "submittedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvangelismTestimony_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismOutreach_tenantId_date_idx" ON "EvangelismOutreach"("tenantId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismOutreachWorker_memberId_idx" ON "EvangelismOutreachWorker"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EvangelismOutreachWorker_outreachId_memberId_key" ON "EvangelismOutreachWorker"("outreachId", "memberId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismContact_tenantId_contactDate_idx" ON "EvangelismContact"("tenantId", "contactDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismContact_workerMemberId_idx" ON "EvangelismContact"("workerMemberId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismContact_outreachId_idx" ON "EvangelismContact"("outreachId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismActivity_contactId_happenedAt_idx" ON "EvangelismActivity"("contactId", "happenedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismActivity_tenantId_actorMemberId_idx" ON "EvangelismActivity"("tenantId", "actorMemberId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismTask_tenantId_status_idx" ON "EvangelismTask"("tenantId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismTask_contactId_idx" ON "EvangelismTask"("contactId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismTaskAssignee_memberId_idx" ON "EvangelismTaskAssignee"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EvangelismTaskAssignee_taskId_memberId_key" ON "EvangelismTaskAssignee"("taskId", "memberId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismTaskNote_taskId_idx" ON "EvangelismTaskNote"("taskId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EvangelismTestimony_tenantId_date_idx" ON "EvangelismTestimony"("tenantId", "date");

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "EvangelismOutreachWorker" ADD CONSTRAINT "EvangelismOutreachWorker_outreachId_fkey" FOREIGN KEY ("outreachId") REFERENCES "EvangelismOutreach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "EvangelismContact" ADD CONSTRAINT "EvangelismContact_outreachId_fkey" FOREIGN KEY ("outreachId") REFERENCES "EvangelismOutreach"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "EvangelismActivity" ADD CONSTRAINT "EvangelismActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "EvangelismContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "EvangelismTask" ADD CONSTRAINT "EvangelismTask_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "EvangelismContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "EvangelismTaskAssignee" ADD CONSTRAINT "EvangelismTaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "EvangelismTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "EvangelismTaskNote" ADD CONSTRAINT "EvangelismTaskNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "EvangelismTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "EvangelismTestimony" ADD CONSTRAINT "EvangelismTestimony_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "EvangelismContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "EvangelismTestimony" ADD CONSTRAINT "EvangelismTestimony_outreachId_fkey" FOREIGN KEY ("outreachId") REFERENCES "EvangelismOutreach"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
