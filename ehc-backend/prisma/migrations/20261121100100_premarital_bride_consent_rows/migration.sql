-- Every application with a checklist gets the bride's consent letter too.
INSERT INTO "CounsellingDocumentRequirement" ("id", "tenantId", "applicationId", "kind", "status", "updatedAt")
SELECT gen_random_uuid()::text, r."tenantId", r."applicationId", 'PARENTAL_CONSENT_BRIDE', 'PENDING', now()
  FROM "CounsellingDocumentRequirement" r
 WHERE r."kind" = 'PARENTAL_CONSENT_GROOM'
   AND NOT EXISTS (
     SELECT 1 FROM "CounsellingDocumentRequirement" b
      WHERE b."applicationId" = r."applicationId" AND b."kind" = 'PARENTAL_CONSENT_BRIDE'
   );
