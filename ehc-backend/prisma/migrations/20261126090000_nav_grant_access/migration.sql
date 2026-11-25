-- Deploy through prisma migrate deploy only.
-- A named page grant can now be view-only. Every existing grant stays FULL,
-- so nobody loses access they have today.

CREATE TYPE "NavGrantAccess" AS ENUM ('VIEW', 'FULL');

ALTER TABLE "NavPermissionGrant"
    ADD COLUMN "access" "NavGrantAccess" NOT NULL DEFAULT 'FULL';
