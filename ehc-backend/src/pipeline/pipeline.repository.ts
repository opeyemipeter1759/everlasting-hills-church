import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { pipelineCte, pipelineOrder, pipelineWhere } from './pipeline.sql';
import {
  PIPELINE_STATUSES,
  type MonthSummary,
  type PipelineFilters,
  type PipelinePage,
  type PipelineRow,
  type PipelineStatus,
  type StatusCounts,
  type YearSummary, type OverrideStatus } from './pipeline.types';

const MAX_TAKE = 200;

const emptyCounts = (): StatusCounts => Object.fromEntries(PIPELINE_STATUSES.map((s) => [s, 0])) as StatusCounts;

/**
 * Prisma keeps timestamps as UTC in columns without a time zone, so json_agg
 * hands them back with no offset. Read such a string as UTC: JavaScript would
 * otherwise read it in the machine's own time zone.
 */
const iso = (d: Date | string | null): string | null => {
  if (d === null) return null;
  const utc = typeof d === 'string' && !/(Z|[+-]\d\d:?\d\d)$/.test(d) ? `${d}Z` : d;
  return new Date(utc).toISOString();
};
const day = (d: Date | string): string => (typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10));

/**
 * The one place follow-up numbers come from. A page of people and the counts
 * beside it are read in a single query under the same filters, so every total
 * equals the sum of its parts and the length of its list. Nothing is counted in
 * JavaScript, and nothing is stored as a counter.
 */
@Injectable()
export class PipelineRepository {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(filters: PipelineFilters = {}): Promise<PipelinePage> {
    const take = Math.min(Math.max(filters.take ?? 50, 1), MAX_TAKE);
    const skip = Math.max(filters.skip ?? 0, 0);
    const [result] = await this.prisma.$queryRaw<{ rows: unknown[] | null; total: number; counts: Record<string, number> | null }[]>(Prisma.sql`
      WITH ${pipelineCte(this.tenantId)},
      listed AS (
        SELECT pl.*, a."firstName" || ' ' || a."lastName" AS "assigneeName", u.name AS "unitName"
          FROM pipeline pl
          LEFT JOIN "Member" a ON a.id = pl."assigneeId"
          LEFT JOIN "Unit" u ON u.id = pl."unitId"
      )
      SELECT
        (SELECT json_agg(r) FROM (
           SELECT * FROM listed pl WHERE ${pipelineWhere(filters)}
            ORDER BY ${pipelineOrder(filters.sort)}, pl."visitorId"
            LIMIT ${take} OFFSET ${skip}) r) AS rows,
        (SELECT COUNT(*)::int FROM listed pl WHERE ${pipelineWhere(filters)}) AS total,
        (SELECT json_object_agg(status, n) FROM (
           SELECT pl.status, COUNT(*)::int AS n FROM listed pl
            WHERE ${pipelineWhere(filters, false)} GROUP BY pl.status) c) AS counts`);

    const counts = { ...emptyCounts(), ...(result.counts ?? {}) } as StatusCounts;
    return {
      rows: (result.rows ?? []).map((r) => this.toRow(r as Record<string, unknown>)),
      total: result.total,
      counts: { ...counts, all: PIPELINE_STATUSES.reduce((n, s) => n + counts[s], 0) },
    };
  }

  /** One person, by visitor id, or null when they are not on record. */
  async one(visitorId: string): Promise<PipelineRow | null> {
    const page = await this.list({ visitorIds: [visitorId], take: 1 });
    return page.rows[0] ?? null;
  }

  /**
   * The year at a glance: twelve months and their total from one query.
   * generate_series fills the empty months; ROLLUP adds the total row.
   * A month holds the people whose first visit fell in it, as they stand today.
   */
  async year(year: number, now = new Date()): Promise<YearSummary> {
    const rows = await this.prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      WITH ${pipelineCte(this.tenantId)},
      tracking AS (SELECT date_trunc('month', MIN(pl."firstContactedAt")) AS since FROM pipeline pl),
      months AS (
        SELECT generate_series(make_date(${year}::int, 1, 1), make_date(${year}::int, 12, 1), interval '1 month')::date AS month
      )
      SELECT m.month,
             GROUPING(m.month) AS "isTotal",
             COUNT(pl."visitorId")::int AS total,
             COUNT(pl."visitorId") FILTER (WHERE pl.status = 'FIRST_TIMER')::int AS "FIRST_TIMER",
             COUNT(pl."visitorId") FILTER (WHERE pl.status = 'SECOND_TIMER')::int AS "SECOND_TIMER",
             COUNT(pl."visitorId") FILTER (WHERE pl.status = 'THIRD_TIMER')::int AS "THIRD_TIMER",
             COUNT(pl."visitorId") FILTER (WHERE pl.status = 'FOURTH_TIMER')::int AS "FOURTH_TIMER",
             COUNT(pl."visitorId") FILTER (WHERE pl.status = 'AWAY')::int AS "AWAY",
             COUNT(pl."visitorId") FILTER (WHERE pl.status = 'INTEGRATED')::int AS "INTEGRATED",
             COUNT(pl."visitorId") FILTER (WHERE pl.status = 'OPTED_OUT')::int AS "OPTED_OUT",
             COUNT(pl."visitorId") FILTER (
               WHERE pl."submittedAt" + interval '48 hours' <= ${now}
                 AND (SELECT since FROM tracking) IS NOT NULL
                 AND pl."submittedAt" >= (SELECT since FROM tracking))::int AS due48,
             COUNT(pl."visitorId") FILTER (
               WHERE pl."submittedAt" + interval '48 hours' <= ${now}
                 AND (SELECT since FROM tracking) IS NOT NULL
                 AND pl."submittedAt" >= (SELECT since FROM tracking)
                 AND pl."firstContactedAt" IS NOT NULL
                 AND pl."firstContactedAt" <= pl."submittedAt" + interval '48 hours')::int AS reached48,
             BOOL_OR((SELECT since FROM tracking) IS NOT NULL
                     AND (m.month + interval '1 month') > (SELECT since FROM tracking)) AS tracked
        FROM months m
        LEFT JOIN pipeline pl
          ON pl."firstVisitDate" >= m.month AND pl."firstVisitDate" < (m.month + interval '1 month')::date
       GROUP BY ROLLUP (m.month)
       ORDER BY m.month NULLS LAST`);

    const [first] = await this.prisma.$queryRaw<{ y: number | null }[]>(Prisma.sql`
      WITH ${pipelineCte(this.tenantId)}
      SELECT EXTRACT(YEAR FROM MIN(pl."firstVisitDate"))::int AS y FROM pipeline pl`);

    const toMonth = (r: Record<string, unknown>): MonthSummary => ({
      month: r.month ? day(r.month as Date) : `${year}-01-01`,
      total: Number(r.total),
      counts: Object.fromEntries(PIPELINE_STATUSES.map((s) => [s, Number(r[s])])) as StatusCounts,
      due48: Number(r.due48),
      reached48: Number(r.reached48),
      tracked: Boolean(r.tracked),
    });
    const months = rows.filter((r) => !r.isTotal).map(toMonth);
    const totalRow = rows.find((r) => r.isTotal);
    return {
      year,
      months,
      total: totalRow ? toMonth(totalRow) : { month: `${year}-01-01`, total: 0, counts: emptyCounts(), due48: 0, reached48: 0, tracked: false },
      firstYear: first?.y ?? year,
    };
  }

  /** How the people under these filters heard about the church, and who has them. */
  async breakdowns(filters: PipelineFilters): Promise<{ heardFrom: { label: string; n: number }[]; assignees: { id: string | null; name: string | null; n: number }[] }> {
    const [result] = await this.prisma.$queryRaw<{ heard: unknown; assignees: unknown }[]>(Prisma.sql`
      WITH ${pipelineCte(this.tenantId)}
      SELECT
        (SELECT COALESCE(json_agg(h ORDER BY h.n DESC, h.label), '[]'::json) FROM (
           SELECT COALESCE(NULLIF(trim(pl."heardFrom"), ''), 'Not given') AS label, COUNT(*)::int AS n
             FROM pipeline pl WHERE ${pipelineWhere(filters)} GROUP BY 1) h) AS heard,
        (SELECT COALESCE(json_agg(a ORDER BY a.n DESC, a.name NULLS LAST), '[]'::json) FROM (
           SELECT pl."assigneeId" AS id, m."firstName" || ' ' || m."lastName" AS name, COUNT(*)::int AS n
             FROM pipeline pl LEFT JOIN "Member" m ON m.id = pl."assigneeId"
            WHERE ${pipelineWhere(filters)} GROUP BY 1, 2) a) AS assignees`);
    return {
      heardFrom: result.heard as { label: string; n: number }[],
      assignees: result.assignees as { id: string | null; name: string | null; n: number }[],
    };
  }

  private toRow(r: Record<string, unknown>): PipelineRow {
    return {
      visitorId: r.visitorId as string,
      memberId: (r.memberId as string | null) ?? null,
      firstName: r.firstName as string,
      lastName: r.lastName as string,
      phone: (r.phone as string | null) ?? null,
      email: (r.email as string | null) ?? null,
      photoKey: (r.photoKey as string | null) ?? null,
      firstVisitDate: day(r.firstVisitDate as string),
      submittedAt: iso(r.submittedAt as string) as string,
      visits: Number(r.visits),
      visitDates: (r.visitDates as string[]) ?? [],
      status: r.status as PipelineStatus,
      entryId: (r.entryId as string | null) ?? null,
      stage: (r.stage as string | null) ?? null,
      assigneeId: (r.assigneeId as string | null) ?? null,
      assigneeName: (r.assigneeName as string | null) ?? null,
      unitId: (r.unitId as string | null) ?? null,
      unitName: (r.unitName as string | null) ?? null,
      assignedAt: iso((r.assignedAt as string | null) ?? null),
      firstContactedAt: iso((r.firstContactedAt as string | null) ?? null),
      heardFrom: (r.heardFrom as string | null) ?? null,
      invitedBy: (r.invitedBy as string | null) ?? null,
      heardFromOther: (r.heardFromOther as string | null) ?? null,
      isStudent: (r.isStudent as boolean | null) ?? null,
      possibleReturn: Boolean(r.possibleReturn),
      statusOverride: (r.statusOverride as OverrideStatus | null) ?? null,
    };
  }
}
