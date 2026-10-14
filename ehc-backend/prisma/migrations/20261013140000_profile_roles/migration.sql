-- Deploy through prisma migrate deploy only.
-- What a member does, shown on their profile like "CEO @sparkpayhq · Lead Pastor @everlastinghills".
ALTER TABLE "MemberProfileDetails" ADD COLUMN IF NOT EXISTS "roles" JSONB NOT NULL DEFAULT '[]';
