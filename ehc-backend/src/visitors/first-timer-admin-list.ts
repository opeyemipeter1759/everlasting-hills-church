import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

const CHURCH_TZ = 'Africa/Lagos';
const MAX_TAKE = 200;

export interface FirstTimerAdminFilters {
  search?: string;
  /** "yes": said they want membership; "no": everyone else. */
  interest?: 'yes' | 'no';
  /** Inclusive "YYYY-MM-DD" bounds on the day they filled the form in, church time. */
  from?: string;
  to?: string;
  /** Bucket on the church-local first visit date, as the Overview does. */
  year?: number;
  month?: number;
  take?: number;
  skip?: number;
}

export interface FirstTimerAdminCounts {
  /** Everyone matching the filters except interest: the sum of interested and notYet. */
  all: number;
  interested: number;
  notYet: number;
  /** Of `all`, who came online and has since checked in online, and who has not. */
  onlineConfirmed: number;
  onlineNew: number;
}

const lagosDate = (column: Prisma.Sql) => Prisma.sql`((${column} AT TIME ZONE 'UTC') AT TIME ZONE ${CHURCH_TZ})::date`;

function where(tenantId: string, f: FirstTimerAdminFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [
    Prisma.sql`v."tenantId" = ${tenantId}`,
    Prisma.sql`v."archivedAt" IS NULL`,
    // This page is for forms nobody has made an account from yet.
    Prisma.sql`v."convertedAt" IS NULL`,
  ];
  const term = f.search?.trim();
  if (term) {
    const like = `%${term}%`;
    parts.push(Prisma.sql`(v."firstName" || ' ' || v."lastName" ILIKE ${like} OR v.email ILIKE ${like} OR v.phone ILIKE ${like})`);
  }
  if (f.from) parts.push(Prisma.sql`${lagosDate(Prisma.sql`v."submittedAt"`)} >= ${f.from}::date`);
  if (f.to) parts.push(Prisma.sql`${lagosDate(Prisma.sql`v."submittedAt"`)} <= ${f.to}::date`);
  const firstVisit = Prisma.sql`COALESCE(v."firstVisitDate", ${lagosDate(Prisma.sql`v."submittedAt"`)})`;
  if (f.year && f.month) {
    parts.push(Prisma.sql`${firstVisit} >= make_date(${f.year}::int, ${f.month}::int, 1)`);
    parts.push(Prisma.sql`${firstVisit} < (make_date(${f.year}::int, ${f.month}::int, 1) + interval '1 month')::date`);
  } else if (f.year) {
    parts.push(Prisma.sql`${firstVisit} >= make_date(${f.year}::int, 1, 1)`);
    parts.push(Prisma.sql`${firstVisit} < make_date(${f.year}::int + 1, 1, 1)`);
  }
  return Prisma.join(parts, ' AND ');
}

const interestWhere = (interest: FirstTimerAdminFilters['interest']): Prisma.Sql =>
  interest === 'yes'
    ? Prisma.sql`b."membershipInterest" = 'Yes'`
    : interest === 'no'
      ? Prisma.sql`b."membershipInterest" IS DISTINCT FROM 'Yes'`
      : Prisma.sql`TRUE`;

/**
 * The admin First Timers page: one page of forms with the totals beside them,
 * from a single query under the same filters. The tab counts add up to "All",
 * and the list's total is the tab it is on, so nothing is counted in the browser.
 */
export async function firstTimerAdminPage(prisma: PrismaService, tenantId: string, f: FirstTimerAdminFilters) {
  const take = Math.min(Math.max(f.take ?? 20, 1), MAX_TAKE);
  const skip = Math.max(f.skip ?? 0, 0);
  const [result] = await prisma.$queryRaw<{ ids: string[] | null; online: string[] | null; total: number; counts: FirstTimerAdminCounts }[]>(Prisma.sql`
    WITH base AS (
      SELECT v.id, v."submittedAt", v."membershipInterest", v."attendanceType",
             EXISTS (SELECT 1 FROM "OnlineCheckIn" o
                      WHERE o."tenantId" = v."tenantId" AND v.email IS NOT NULL AND lower(o.email) = lower(v.email)) AS "checkedIn"
        FROM "Visitor" v
       WHERE ${where(tenantId, f)}
    ),
    page AS (
      SELECT b.id, b."checkedIn" FROM base b WHERE ${interestWhere(f.interest)}
       ORDER BY b."submittedAt" DESC, b.id LIMIT ${take} OFFSET ${skip}
    )
    SELECT
      (SELECT array_agg(id) FROM page) AS ids,
      (SELECT array_agg(id) FROM page WHERE "checkedIn") AS online,
      (SELECT COUNT(*)::int FROM base b WHERE ${interestWhere(f.interest)}) AS total,
      (SELECT json_build_object(
         'all', COUNT(*)::int,
         'interested', COUNT(*) FILTER (WHERE "membershipInterest" = 'Yes')::int,
         'notYet', COUNT(*) FILTER (WHERE "membershipInterest" IS DISTINCT FROM 'Yes')::int,
         'onlineConfirmed', COUNT(*) FILTER (WHERE "attendanceType" = 'Online' AND "checkedIn")::int,
         'onlineNew', COUNT(*) FILTER (WHERE "attendanceType" = 'Online' AND NOT "checkedIn")::int)
         FROM base) AS counts`);

  const ids = result.ids ?? [];
  const online = new Set(result.online ?? []);
  const rows = ids.length ? await prisma.visitor.findMany({ where: { id: { in: ids } } }) : [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  return {
    rows: ids.flatMap((id) => {
      const row = byId.get(id);
      return row ? [{ ...row, hasOnlineCheckIn: online.has(id) }] : [];
    }),
    total: result.total,
    counts: result.counts,
  };
}
