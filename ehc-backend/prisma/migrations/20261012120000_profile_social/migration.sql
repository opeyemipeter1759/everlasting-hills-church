-- Deploy through prisma migrate deploy only.
-- Member profiles become social: likes and words of encouragement on a
-- profile, and books from the library a member has finished (for badges).
CREATE TABLE IF NOT EXISTS "ProfileLike" (
  "id"            TEXT NOT NULL,
  "tenantId"      TEXT NOT NULL,
  "memberId"      TEXT NOT NULL,
  "likerMemberId" TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfileLike_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProfileLike_memberId_likerMemberId_key" ON "ProfileLike"("memberId", "likerMemberId");
CREATE INDEX IF NOT EXISTS "ProfileLike_likerMemberId_idx" ON "ProfileLike"("likerMemberId");
DO $$ BEGIN
  ALTER TABLE "ProfileLike" ADD CONSTRAINT "ProfileLike_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProfileLike" ADD CONSTRAINT "ProfileLike_likerMemberId_fkey" FOREIGN KEY ("likerMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ProfileComment" (
  "id"             TEXT NOT NULL,
  "tenantId"       TEXT NOT NULL,
  "memberId"       TEXT NOT NULL,
  "authorMemberId" TEXT NOT NULL,
  "body"           TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfileComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProfileComment_memberId_createdAt_idx" ON "ProfileComment"("memberId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProfileComment_authorMemberId_idx" ON "ProfileComment"("authorMemberId");
DO $$ BEGIN
  ALTER TABLE "ProfileComment" ADD CONSTRAINT "ProfileComment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProfileComment" ADD CONSTRAINT "ProfileComment_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "MemberBookRead" (
  "id"       TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "bookId"   TEXT NOT NULL,
  "readAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemberBookRead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MemberBookRead_memberId_bookId_key" ON "MemberBookRead"("memberId", "bookId");
DO $$ BEGIN
  ALTER TABLE "MemberBookRead" ADD CONSTRAINT "MemberBookRead_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "MemberBookRead" ADD CONSTRAINT "MemberBookRead_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
