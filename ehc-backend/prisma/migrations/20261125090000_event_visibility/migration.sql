-- Deploy through prisma migrate deploy only.
-- Events can be PUBLIC (everyone) or PRIVATE (signed-in users only). Every
-- existing event stays PUBLIC, so nothing disappears from the site.

CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

ALTER TABLE "Event"
    ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC';
