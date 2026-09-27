-- Deploy through prisma migrate deploy only.

-- Past activity into the activity threads. Until 2026-09-22 the team logged
-- contacts (FollowUpContactLog); since then they talk in each person's thread
-- (FollowUpNote), which is all the Activity panel shows — so the earlier work
-- had disappeared from view. Copy every log onto its person's thread, at the
-- time it was logged and under the name of whoever logged it. The logs
-- themselves are left untouched.
--
-- The wording matches contactLogBody() in
-- src/follow-up/services/contact-log-note.util.ts. The note id is derived
-- from the log id, so this is safe to run twice and never duplicates a log the
-- code has already mirrored.
INSERT INTO "FollowUpNote" ("id", "tenantId", "subjectKind", "subjectId", "authorId", "body", "parentId", "createdAt")
SELECT
  'log-' || l."id",
  l."tenantId",
  CASE WHEN e."memberId" IS NOT NULL THEN 'MEMBER' ELSE 'VISITOR' END,
  COALESCE(e."memberId", e."visitorId"),
  m."profileId",
  CASE
    WHEN l."kind" = 'CONNECTION' THEN '🤝 ' || btrim(l."note")
    WHEN l."kind" <> 'CONTACT' THEN btrim(l."note")
    ELSE
      concat_ws(' · ',
        CASE l."method"
          WHEN 'CALL' THEN '📞 Call'
          WHEN 'SMS' THEN '💬 SMS'
          WHEN 'WHATSAPP' THEN '💬 WhatsApp'
          WHEN 'VISIT' THEN '🏠 Visit'
          ELSE '📋 Contact'
        END,
        CASE l."outcome"
          WHEN 'REACHED' THEN 'Reached'
          WHEN 'NO_ANSWER' THEN 'No answer'
          WHEN 'VOICEMAIL' THEN 'Voicemail'
          WHEN 'WRONG_NUMBER' THEN 'Wrong number'
          WHEN 'SCHEDULED_VISIT' THEN 'Visit scheduled'
        END,
        CASE WHEN l."isPastoralContact" THEN 'Pastor''s call' END
      )
      || CASE WHEN btrim(l."note") <> '' THEN E'\n' || btrim(l."note") ELSE '' END
  END,
  NULL,
  l."createdAt"
FROM "FollowUpContactLog" l
JOIN "FollowUpEntry" e ON e."id" = l."entryId"
JOIN "Member" m ON m."id" = l."byId"
WHERE COALESCE(e."memberId", e."visitorId") IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
