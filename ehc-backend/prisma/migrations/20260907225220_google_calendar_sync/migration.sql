-- AlterTable
ALTER TABLE "GoogleCalendarConnection" ADD COLUMN "googleCalendarId" TEXT;

-- CreateTable
CREATE TABLE "GoogleCalendarSyncedEvent" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarSyncedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoogleCalendarSyncedEvent_connectionId_idx" ON "GoogleCalendarSyncedEvent"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarSyncedEvent_connectionId_itemKey_key" ON "GoogleCalendarSyncedEvent"("connectionId", "itemKey");

-- AddForeignKey
ALTER TABLE "GoogleCalendarSyncedEvent" ADD CONSTRAINT "GoogleCalendarSyncedEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GoogleCalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
