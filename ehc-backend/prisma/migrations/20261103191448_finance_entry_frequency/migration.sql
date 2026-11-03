-- Deploy through prisma migrate deploy only.
-- Finance ledger: a "how often" label on each income/expense entry
-- (Daily/Weekly/Monthly/One-time). Additive, defaults existing rows to ONE_TIME.

DO $$ BEGIN
  CREATE TYPE "FinanceEntryFrequency" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "FinanceEntry" ADD COLUMN IF NOT EXISTS "frequency" "FinanceEntryFrequency" NOT NULL DEFAULT 'ONE_TIME';

-- Rollback notes (manual):
--   ALTER TABLE "FinanceEntry" DROP COLUMN "frequency";
--   DROP TYPE "FinanceEntryFrequency";
