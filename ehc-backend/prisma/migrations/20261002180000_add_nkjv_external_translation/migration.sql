-- NKJV is copyrighted by Thomas Nelson. The reading plan links each assigned
-- chapter to YouVersion's licensed reader instead of storing the text here.
INSERT INTO "BibleTranslation" ("code", "name", "licence", "isDefault")
VALUES ('NKJV', 'New King James Version', 'external-youversion', FALSE)
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name", "licence" = EXCLUDED."licence";
