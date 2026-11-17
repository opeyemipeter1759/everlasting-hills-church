import { Prisma } from '@prisma/client';
import type { PipelineFilters } from './pipeline.types';

/** Church time. Month boundaries and visit dates are all Lagos dates. */
export const CHURCH_TZ = 'Africa/Lagos';

/** A UTC timestamp column as its Lagos calendar date. */
const lagosDate = (column: Prisma.Sql) => Prisma.sql`((${column} AT TIME ZONE 'UTC') AT TIME ZONE ${CHURCH_TZ})::date`;

/**
 * The first-timer pipeline as one set of rows: everyone who filled in the
 * first-timer form and is still on record (not archived, and not turned into
 * an account that was later deleted), with their follow-up entry, their visits
 * and the status those give them.
 *
 * Visits are distinct Lagos dates: recorded visits, plus present check-ins once
 * they have an account, plus the first visit itself. Two services on one day
 * are one visit.
 *
 * Every list, count and summary in follow-up reads from this, so a total can
 * never disagree with the rows beside it.
 */
export function pipelineCte(tenantId: string): Prisma.Sql {
  return Prisma.sql`
    people AS (
      SELECT v.id AS "visitorId", m.id AS "memberId", m.status::text AS "memberStatus",
             v."firstName", v."lastName", v.phone, v.email, v."photoKey", v."submittedAt",
             COALESCE(v."firstVisitDate", ${lagosDate(Prisma.sql`v."submittedAt"`)}) AS "firstVisitDate",
             v."howDidYouLearn" AS "heardFrom", v."invitedBy", v."heardFromOther", v."isStudent",
             (v."possibleReturnVisitorId" IS NOT NULL OR v."possibleReturnMemberId" IS NOT NULL)
               AND v."possibleReturnResolvedAt" IS NULL AS "possibleReturn"
        FROM "Visitor" v
        LEFT JOIN "Member" m ON m.id = v."convertedToMemberId"
       WHERE v."tenantId" = ${tenantId}
         AND v."archivedAt" IS NULL
         AND (v."convertedAt" IS NULL OR m.id IS NOT NULL)
    ),
    entries AS (
      SELECT DISTINCT ON (p."visitorId") p."visitorId", e.id AS "entryId", e.stage::text AS stage,
             e."assigneeId", e."unitId", e."assignedAt", e."firstContactedAt"
        FROM people p
        JOIN "FollowUpEntry" e
          ON e."visitorId" = p."visitorId" OR (p."memberId" IS NOT NULL AND e."memberId" = p."memberId")
       ORDER BY p."visitorId", (e."memberId" = p."memberId") DESC NULLS LAST, e."updatedAt" DESC
    ),
    visit_dates AS (
      SELECT fv."visitorId", fv."visitedOn" AS d
        FROM "FirstTimerVisit" fv JOIN people p ON p."visitorId" = fv."visitorId"
      UNION
      SELECT p."visitorId", ${lagosDate(Prisma.sql`s."scheduledAt"`)}
        FROM people p
        JOIN "AttendanceRecord" ar ON ar."memberId" = p."memberId" AND ar.present
        JOIN "Service" s ON s.id = ar."serviceId"
      UNION
      SELECT p."visitorId", p."firstVisitDate" FROM people p
    ),
    visits AS (
      SELECT "visitorId", COUNT(*)::int AS n, array_agg(to_char(d, 'YYYY-MM-DD') ORDER BY d) AS dates
        FROM visit_dates GROUP BY "visitorId"
    ),
    pipeline AS (
      SELECT p.*, e."entryId", e.stage, e."assigneeId", e."unitId", e."assignedAt", e."firstContactedAt",
             COALESCE(vs.n, 1) AS visits, COALESCE(vs.dates, ARRAY[]::text[]) AS "visitDates",
             CASE
               WHEN e.stage = 'OPTED_OUT' OR (p."memberStatus" IS NOT NULL AND p."memberStatus" <> 'ACTIVE') THEN 'OPTED_OUT'
               WHEN e.stage = 'CONFIRMED' THEN 'INTEGRATED'
               WHEN COALESCE(vs.n, 1) >= 3 THEN 'THIRD_TIMER'
               WHEN vs.n = 2 THEN 'SECOND_TIMER'
               ELSE 'FIRST_TIMER'
             END AS status
        FROM people p
        LEFT JOIN entries e ON e."visitorId" = p."visitorId"
        LEFT JOIN visits vs ON vs."visitorId" = p."visitorId"
    )`;
}

/** The WHERE clause for a set of filters; `withStatus` false leaves status out, for the counts beside a list. */
export function pipelineWhere(f: PipelineFilters, withStatus = true): Prisma.Sql {
  const parts: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (withStatus && f.status) parts.push(Prisma.sql`pl.status = ${f.status}`);
  if (f.stage) parts.push(Prisma.sql`pl.stage = ${f.stage}`);
  if (f.assigneeId === 'none') parts.push(Prisma.sql`pl."assigneeId" IS NULL`);
  else if (f.assigneeId) parts.push(Prisma.sql`pl."assigneeId" = ${f.assigneeId}`);
  if (f.unitId) parts.push(Prisma.sql`pl."unitId" = ${f.unitId}`);
  if (f.student !== undefined) parts.push(f.student ? Prisma.sql`pl."isStudent" IS TRUE` : Prisma.sql`pl."isStudent" IS NOT TRUE`);
  if (f.year && f.month) {
    parts.push(Prisma.sql`pl."firstVisitDate" >= make_date(${f.year}::int, ${f.month}::int, 1)`);
    parts.push(Prisma.sql`pl."firstVisitDate" < (make_date(${f.year}::int, ${f.month}::int, 1) + interval '1 month')::date`);
  } else if (f.year) {
    parts.push(Prisma.sql`pl."firstVisitDate" >= make_date(${f.year}::int, 1, 1)`);
    parts.push(Prisma.sql`pl."firstVisitDate" < make_date(${f.year}::int + 1, 1, 1)`);
  }
  if (f.search?.trim()) {
    const term = `%${f.search.trim()}%`;
    const digits = f.search.replace(/\D/g, '');
    parts.push(
      digits.length >= 4
        ? Prisma.sql`(pl."firstName" || ' ' || pl."lastName" ILIKE ${term} OR regexp_replace(COALESCE(pl.phone, ''), '\\D', '', 'g') LIKE ${`%${digits.slice(-10)}%`})`
        : Prisma.sql`(pl."firstName" || ' ' || pl."lastName" ILIKE ${term})`,
    );
  }
  if (f.notContacted) parts.push(Prisma.sql`pl."firstContactedAt" IS NULL`);
  if (f.possibleReturn) parts.push(Prisma.sql`pl."possibleReturn"`);
  if (f.visitorIds) parts.push(f.visitorIds.length ? Prisma.sql`pl."visitorId" IN (${Prisma.join(f.visitorIds)})` : Prisma.sql`FALSE`);
  if (f.absentFromServiceId) {
    parts.push(Prisma.sql`pl."memberId" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM "AttendanceRecord" ar
       WHERE ar."memberId" = pl."memberId" AND ar."serviceId" = ${f.absentFromServiceId} AND ar.present)`);
  }
  return Prisma.join(parts, ' AND ');
}

export function pipelineOrder(sort: PipelineFilters['sort']): Prisma.Sql {
  if (sort === 'oldest') return Prisma.sql`pl."firstVisitDate" ASC, pl."submittedAt" ASC`;
  if (sort === 'name') return Prisma.sql`pl."firstName" ASC, pl."lastName" ASC`;
  return Prisma.sql`pl."firstVisitDate" DESC, pl."submittedAt" DESC`;
}
