-- Deploy through prisma migrate deploy only.
-- The LinkedIn-style profile a member writes for themselves: headline, cover
-- banner, favourite scripture, spiritual journey, career, gifts, interests,
-- languages, prayer focus, testimony, what they are open to, and who sees what.
CREATE TABLE IF NOT EXISTS "MemberProfileDetails" (
  "memberId"            TEXT NOT NULL,
  "tenantId"            TEXT NOT NULL,
  "headline"            TEXT,
  "coverUrl"            TEXT,
  "favouriteVerse"      TEXT,
  "favouriteVerseRef"   TEXT,
  "bornAgainYear"       SMALLINT,
  "waterBaptismYear"    SMALLINT,
  "holySpiritYear"      SMALLINT,
  "membershipClassYear" SMALLINT,
  "occupation"          TEXT,
  "employer"            TEXT,
  "industry"            TEXT,
  "skills"              TEXT[] DEFAULT ARRAY[]::TEXT[],
  "gifts"               TEXT[] DEFAULT ARRAY[]::TEXT[],
  "interests"           TEXT[] DEFAULT ARRAY[]::TEXT[],
  "languages"           TEXT[] DEFAULT ARRAY[]::TEXT[],
  "prayerFocus"         TEXT,
  "testimony"           TEXT,
  "openTo"              TEXT[] DEFAULT ARRAY[]::TEXT[],
  "visibility"          JSONB NOT NULL DEFAULT '{}',
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemberProfileDetails_pkey" PRIMARY KEY ("memberId")
);
DO $$ BEGIN
  ALTER TABLE "MemberProfileDetails" ADD CONSTRAINT "MemberProfileDetails_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
