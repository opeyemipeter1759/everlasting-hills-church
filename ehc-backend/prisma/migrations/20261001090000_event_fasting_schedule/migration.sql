-- Deploy through prisma migrate deploy only.

-- A fasting schedule section for events (Furnace '26 and later fasts).
ALTER TYPE "EventSectionType" ADD VALUE IF NOT EXISTS 'FASTING_SCHEDULE';
