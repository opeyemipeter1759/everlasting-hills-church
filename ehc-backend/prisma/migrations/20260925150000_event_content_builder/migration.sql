-- Extend the existing event status instead of replacing it, preserving all rows.
ALTER TYPE "EventStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

CREATE TYPE "EventLocationType" AS ENUM ('PHYSICAL', 'ONLINE', 'HYBRID');
CREATE TYPE "EventSectionType" AS ENUM (
  'RICH_TEXT',
  'SCHEDULE',
  'EXPECTATIONS',
  'PRAYER_FOCUS',
  'FAQ',
  'TESTIMONY',
  'CTA'
);

ALTER TABLE "Event"
  ADD COLUMN "theme" TEXT,
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
  ADD COLUMN "locationType" "EventLocationType" NOT NULL DEFAULT 'PHYSICAL',
  ADD COLUMN "coverImageUrl" TEXT,
  ADD COLUMN "heroImageUrl" TEXT,
  ADD COLUMN "socialImageUrl" TEXT,
  ADD COLUMN "liveUrl" TEXT,
  ADD COLUMN "registrationUrl" TEXT,
  ADD COLUMN "testimonyUrl" TEXT,
  ADD COLUMN "primaryCtaLabel" TEXT,
  ADD COLUMN "primaryCtaUrl" TEXT,
  ADD COLUMN "secondaryCtaLabel" TEXT,
  ADD COLUMN "secondaryCtaUrl" TEXT,
  ADD COLUMN "seoTitle" TEXT,
  ADD COLUMN "seoDescription" TEXT,
  ADD COLUMN "registrationRequired" BOOLEAN NOT NULL DEFAULT true;

-- Existing flyer and RSVP settings remain the source of truth for legacy records.
UPDATE "Event"
SET
  "coverImageUrl" = "flyerImageUrl",
  "registrationRequired" = "rsvpEnabled"
WHERE true;

CREATE TABLE "EventSchedule" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT,
  "recurrenceRule" TEXT,
  "meetingUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EventSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventSection" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "type" "EventSectionType" NOT NULL,
  "title" TEXT,
  "subtitle" TEXT,
  "content" JSONB NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EventSection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventSchedule_tenantId_eventId_sortOrder_idx"
  ON "EventSchedule"("tenantId", "eventId", "sortOrder");

CREATE INDEX "EventSection_tenantId_eventId_sortOrder_idx"
  ON "EventSection"("tenantId", "eventId", "sortOrder");

CREATE INDEX "Event_tenantId_status_featured_startAt_idx"
  ON "Event"("tenantId", "status", "featured", "startAt");

CREATE INDEX "Event_tenantId_endAt_idx"
  ON "Event"("tenantId", "endAt");

ALTER TABLE "EventSchedule"
  ADD CONSTRAINT "EventSchedule_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventSchedule"
  ADD CONSTRAINT "EventSchedule_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventSection"
  ADD CONSTRAINT "EventSection_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventSection"
  ADD CONSTRAINT "EventSection_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
