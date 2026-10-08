-- One row per one-off push notice (a Furnace session's 2-hour reminder, its
-- "we're live" alert), so a re-run of the job never notifies anyone twice.
CREATE TABLE IF NOT EXISTS "PushNoticeLog" (
  "id"        TEXT NOT NULL,
  "tenantId"  TEXT NOT NULL,
  "key"       TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushNoticeLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PushNoticeLog_tenantId_key_key" ON "PushNoticeLog"("tenantId", "key");
