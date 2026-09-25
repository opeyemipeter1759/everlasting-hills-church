-- Links an announcement back to the event it was raised from.
-- Unique: publishing the same event again (unpublish → republish, or an edit
-- that re-saves the status) must not announce it a second time.
ALTER TABLE "Announcement" ADD COLUMN "eventId" TEXT;

CREATE UNIQUE INDEX "Announcement_eventId_key" ON "Announcement"("eventId");

ALTER TABLE "Announcement"
  ADD CONSTRAINT "Announcement_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
