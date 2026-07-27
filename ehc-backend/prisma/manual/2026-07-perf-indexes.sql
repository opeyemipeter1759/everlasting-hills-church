-- ─────────────────────────────────────────────────────────────────────────────
-- Performance indexes for the highest-traffic tables (attendance, services,
-- members, giving, engagement scores). These tables predate the convention of
-- adding @@index alongside new models and were never indexed beyond their
-- unique constraints, so every analytics/reporting query against them was
-- doing a full table scan.
--   npx prisma db execute --file prisma/manual/2026-07-perf-indexes.sql --schema prisma/schema.prisma
-- Safe to re-run. Matches the @@index additions in prisma/schema.prisma.

CREATE INDEX IF NOT EXISTS "AttendanceRecord_tenantId_serviceId_idx" ON "AttendanceRecord"("tenantId", "serviceId");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_serviceId_present_idx" ON "AttendanceRecord"("serviceId", "present");

CREATE INDEX IF NOT EXISTS "Service_tenantId_scheduledAt_idx" ON "Service"("tenantId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "Service_tenantId_serviceType_scheduledAt_idx" ON "Service"("tenantId", "serviceType", "scheduledAt");

CREATE INDEX IF NOT EXISTS "Member_tenantId_status_idx" ON "Member"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Member_tenantId_joinedAt_idx" ON "Member"("tenantId", "joinedAt");
CREATE INDEX IF NOT EXISTS "Member_tenantId_email_idx" ON "Member"("tenantId", "email");

CREATE INDEX IF NOT EXISTS "GivingRecord_tenantId_paystackStatus_createdAt_idx" ON "GivingRecord"("tenantId", "paystackStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "GivingRecord_tenantId_category_idx" ON "GivingRecord"("tenantId", "category");
CREATE INDEX IF NOT EXISTS "GivingRecord_donorEmail_idx" ON "GivingRecord"("donorEmail");

CREATE INDEX IF NOT EXISTS "EngagementScore_tenantId_score_idx" ON "EngagementScore"("tenantId", "score");
