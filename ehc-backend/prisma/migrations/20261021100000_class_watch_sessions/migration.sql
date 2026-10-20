-- Deploy through prisma migrate deploy only.
-- Server-verified watching: a lesson video counts as watched only when the server has seen
-- the watching, not when the browser says so. Adds the video length, the watching the server
-- has credited per lesson, and one row per sitting. The new table has row level security on,
-- with no policies: deny-all to the Supabase data API, like every other table.
-- Additive only.

ALTER TABLE "CourseLesson"
  ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;

ALTER TABLE "LessonProgress"
  ADD COLUMN IF NOT EXISTS "watchMaxPosition" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "watchSeconds" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "watchLastHeartbeatAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "LessonWatchSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPosition" INTEGER NOT NULL DEFAULT 0,
    "maxPosition" INTEGER NOT NULL DEFAULT 0,
    "accumulatedSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LessonWatchSession_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LessonWatchSession" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS "LessonWatchSession_enrollmentId_lessonId_idx" ON "LessonWatchSession"("enrollmentId", "lessonId");

CREATE INDEX IF NOT EXISTS "LessonWatchSession_tenantId_idx" ON "LessonWatchSession"("tenantId");

CREATE INDEX IF NOT EXISTS "LessonWatchSession_lastHeartbeatAt_idx" ON "LessonWatchSession"("lastHeartbeatAt");

DO $$ BEGIN
  ALTER TABLE "LessonWatchSession" ADD CONSTRAINT "LessonWatchSession_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CourseEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LessonWatchSession" ADD CONSTRAINT "LessonWatchSession_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CourseLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
