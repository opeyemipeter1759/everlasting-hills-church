-- Deploy through prisma migrate deploy only.
-- Marital status as its own field, and a spouse link that both members must
-- agree to: SpouseRequest holds the ask until the other member accepts.
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "maritalStatus" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "spouseMemberId" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "spouseName" TEXT;
CREATE INDEX IF NOT EXISTS "Member_spouseMemberId_idx" ON "Member"("spouseMemberId");
DO $$ BEGIN
  ALTER TABLE "Member" ADD CONSTRAINT "Member_spouseMemberId_fkey" FOREIGN KEY ("spouseMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Members already shown as married, by a wedding date, stay married.
UPDATE "Member" SET "maritalStatus" = 'MARRIED' WHERE "maritalStatus" IS NULL AND "weddingAnniversary" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "SpouseRequest" (
  "id"           TEXT NOT NULL,
  "tenantId"     TEXT NOT NULL,
  "fromMemberId" TEXT NOT NULL,
  "toMemberId"   TEXT NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt"  TIMESTAMP(3),
  CONSTRAINT "SpouseRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SpouseRequest_toMemberId_status_idx" ON "SpouseRequest"("toMemberId", "status");
CREATE INDEX IF NOT EXISTS "SpouseRequest_fromMemberId_status_idx" ON "SpouseRequest"("fromMemberId", "status");
DO $$ BEGIN
  ALTER TABLE "SpouseRequest" ADD CONSTRAINT "SpouseRequest_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "SpouseRequest" ADD CONSTRAINT "SpouseRequest_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
