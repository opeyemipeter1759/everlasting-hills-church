-- Deprecate the legacy single-role column. Run AFTER the backfill.
-- Profile.role is no longer the source of truth (grants + assignments are).
-- Renamed (not dropped) so the pre-migration snapshot is preserved for rollback.
-- Idempotent: only renames if the old column still exists.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Profile' AND column_name = 'role'
  ) THEN
    ALTER TABLE "Profile" RENAME COLUMN "role" TO "legacyRole";
  END IF;
END $$;
