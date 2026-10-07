-- The church no longer offers NKJV (copyrighted; it was only ever a link out to
-- YouVersion). Anyone reading a plan in it moves to KJV, the closest version
-- held in full here, and the translation is removed.
UPDATE "MemberPlanSubscription"
SET "translationId" = (SELECT "id" FROM "BibleTranslation" WHERE "code" = 'KJV')
WHERE "translationId" = (SELECT "id" FROM "BibleTranslation" WHERE "code" = 'NKJV');

DELETE FROM "BibleTranslation" WHERE "code" = 'NKJV';
