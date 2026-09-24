-- Deploy through prisma migrate deploy only.

-- Sermon digest: one row per YouTube service video Gemini has looked at.
CREATE TABLE IF NOT EXISTS "SermonDigest" (
  "id"                 TEXT         NOT NULL,
  "tenantId"           TEXT         NOT NULL,
  "videoId"            TEXT         NOT NULL,
  "videoTitle"         TEXT         NOT NULL,
  "publishedAt"        TIMESTAMP(3) NOT NULL,
  "serviceDay"         TEXT         NOT NULL,
  "status"             TEXT         NOT NULL,
  "reason"             TEXT,
  "attempts"           INTEGER      NOT NULL DEFAULT 0,
  "model"              TEXT,
  "sermonStartSeconds" INTEGER,
  "sermonEndSeconds"   INTEGER,
  "sermonTitle"        TEXT,
  "preacher"           TEXT,
  "bibleReferences"    JSONB,
  "summary"            TEXT,
  "keyPoints"          JSONB,
  "wordOfTheDay"       JSONB,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SermonDigest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SermonDigest_tenantId_videoId_key" ON "SermonDigest"("tenantId", "videoId");
CREATE INDEX IF NOT EXISTS "SermonDigest_tenantId_status_publishedAt_idx" ON "SermonDigest"("tenantId", "status", "publishedAt");

DO $$
BEGIN
  ALTER TABLE "SermonDigest"
    ADD CONSTRAINT "SermonDigest_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
