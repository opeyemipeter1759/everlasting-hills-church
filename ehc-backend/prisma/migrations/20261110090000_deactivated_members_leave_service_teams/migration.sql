-- A deactivated member serves on no team. Deactivating now takes people off
-- every unit (see src/members/leave-service-teams.ts); this applies the same
-- rule to everyone deactivated before it did.

-- 1. Note the teams each one is on, so a later reactivation can see where they served.
INSERT INTO "AuditLog" ("id", "tenantId", "actorId", "action", "entity", "entityId", "before", "createdAt")
SELECT
  gen_random_uuid()::text,
  m."tenantId",
  NULL,
  'LEFT_SERVICE_TEAMS',
  'Member',
  m."id",
  jsonb_build_object('teams', jsonb_agg(jsonb_build_object(
    'unitId', um."unitId",
    'unitName', u."name",
    'isLead', um."isLead",
    'isAssistant', um."isAssistant",
    'positionId', um."positionId",
    'joinedAt', um."joinedAt"
  ) ORDER BY u."name")),
  now()
FROM "UnitMember" um
JOIN "Member" m ON m."id" = um."memberId"
JOIN "Unit" u ON u."id" = um."unitId"
WHERE m."status" <> 'ACTIVE'
GROUP BY m."id", m."tenantId";

-- 2. End any unit lead assignment they still hold (ended, not deleted, to keep the history).
UPDATE "UnitLeadAssignment" ula
SET "endedAt" = now()
FROM "Member" m
WHERE m."profileId" = ula."userId"
  AND m."status" <> 'ACTIVE'
  AND ula."endedAt" IS NULL;

-- 3. Take them off their teams.
DELETE FROM "UnitMember" um
USING "Member" m
WHERE m."id" = um."memberId"
  AND m."status" <> 'ACTIVE';
