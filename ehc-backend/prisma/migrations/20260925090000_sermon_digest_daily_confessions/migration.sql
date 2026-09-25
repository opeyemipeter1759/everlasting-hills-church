-- Deploy through prisma migrate deploy only.

-- A fresh confession for each day after the service (string[][]), written
-- from the same sermon so the Hills Confession changes daily between services.
ALTER TABLE "SermonDigest" ADD COLUMN IF NOT EXISTS "dailyConfessions" JSONB;
