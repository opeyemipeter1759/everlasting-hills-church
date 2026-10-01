-- Deploy through prisma migrate deploy only.

-- Daily fasting email: session recaps, a per-recipient send log, unsubscribes.
CREATE TABLE IF NOT EXISTS "FastingRecap" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "videoId" TEXT NOT NULL,
  "videoTitle" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "title" TEXT,
  "summary" TEXT,
  "keyPoints" JSONB,
  "reason" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FastingRecap_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FastingRecap_tenantId_videoId_key" ON "FastingRecap"("tenantId", "videoId");
CREATE INDEX IF NOT EXISTS "FastingRecap_tenantId_startedAt_idx" ON "FastingRecap"("tenantId", "startedAt");

CREATE TABLE IF NOT EXISTS "DailyEmailLog" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "campaign" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailyEmailLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DailyEmailLog_tenantId_campaign_day_email_key" ON "DailyEmailLog"("tenantId", "campaign", "day", "email");
CREATE INDEX IF NOT EXISTS "DailyEmailLog_tenantId_campaign_day_idx" ON "DailyEmailLog"("tenantId", "campaign", "day");

CREATE TABLE IF NOT EXISTS "EmailUnsubscribe" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailUnsubscribe_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmailUnsubscribe_tenantId_email_key" ON "EmailUnsubscribe"("tenantId", "email");
