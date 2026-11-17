/**
 * Follow-up v2, data step 2 (run after backfill-first-visit): keep today's
 * Second and Third timers where they are.
 *
 * Before v2 the team set those statuses by hand on the Master List. v2 counts
 * them from visits instead, so a person whose latest APPROVED status change
 * says SECOND_TIMER (2 visits) or THIRD_TIMER (3) gets the visits that are
 * missing, marked source BACKFILL_STATUS. The first is dated on the Lagos day
 * the status was approved, a second one the day before. A day they already
 * have is skipped, walking further back (never onto or before their first
 * visit), then forward from the approval day. A member's status counts for
 * the form their account was made from; the latest change across both wins,
 * as on the Master List. Idempotent: people already at their count are left.
 *
 *   npx ts-node --transpile-only scripts/followup-v2/backfill-status-visits.ts            (dry run)
 *   npx ts-node --transpile-only scripts/followup-v2/backfill-status-visits.ts --apply
 * Tenant: DEFAULT_TENANT_ID, or --tenant=<id>.
 */
import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PipelineRepository } from '../../src/pipeline/pipeline.repository';
import type { PipelineRow } from '../../src/pipeline/pipeline.types';
import { addDays, dateColumn, lagosDay } from '../../src/follow-up/visits/visit-day.util';
import { runDataScript } from './data-script';

const TARGET: Record<string, number> = { SECOND_TIMER: 2, THIRD_TIMER: 3 };

export interface StatusVisitPlan {
  visitorId: string;
  name: string;
  status: string;
  visits: number;
  add: string[];
}

/** The days to add so `row` has `target` visits: the approval day, then the days before it, then after. */
export function daysToAdd(row: Pick<PipelineRow, 'firstVisitDate' | 'visitDates' | 'visits'>, target: number, approvedOn: string, today: string): string[] {
  const taken = new Set([...row.visitDates, row.firstVisitDate]);
  const add: string[] = [];
  const need = target - row.visits;
  for (let d = approvedOn; add.length < need && d > row.firstVisitDate; d = addDays(d, -1)) {
    if (!taken.has(d)) add.push(d);
  }
  for (let d = addDays(approvedOn, 1); add.length < need && d <= today; d = addDays(d, 1)) {
    if (d > row.firstVisitDate && !taken.has(d)) add.push(d);
  }
  return add.sort();
}

export async function planStatusVisits(prisma: PrismaClient, tenantId: string, now = new Date()): Promise<StatusVisitPlan[]> {
  const changes = await prisma.followUpStatusChange.findMany({
    where: { tenantId, state: 'APPROVED' },
    orderBy: { requestedAt: 'asc' },
    select: { subjectKind: true, subjectId: true, toStatus: true, requestedAt: true, decidedAt: true },
  });
  const memberIds = changes.filter((c) => c.subjectKind === 'MEMBER').map((c) => c.subjectId);
  const forms = memberIds.length
    ? await prisma.visitor.findMany({ where: { tenantId, convertedToMemberId: { in: memberIds } }, select: { id: true, convertedToMemberId: true } })
    : [];

  // Oldest first, so each person ends on their most recent approved status.
  const latest = new Map<string, (typeof changes)[number]>();
  for (const c of changes) {
    const ids = c.subjectKind === 'VISITOR' ? [c.subjectId] : forms.filter((f) => f.convertedToMemberId === c.subjectId).map((f) => f.id);
    for (const id of ids) latest.set(id, c);
  }
  const wanted = [...latest].filter(([, c]) => TARGET[c.toStatus]);

  const pipeline = new PipelineRepository(prisma as never, { get: () => tenantId } as never);
  const plan: StatusVisitPlan[] = [];
  for (let i = 0; i < wanted.length; i += 200) {
    const chunk = wanted.slice(i, i + 200);
    const { rows } = await pipeline.list({ visitorIds: chunk.map(([id]) => id), take: 200 });
    const byId = new Map(rows.map((r) => [r.visitorId, r]));
    for (const [visitorId, change] of chunk) {
      const row = byId.get(visitorId);
      if (!row || row.visits >= TARGET[change.toStatus]) continue; // archived, or already there
      const add = daysToAdd(row, TARGET[change.toStatus], lagosDay(change.decidedAt ?? change.requestedAt), lagosDay(now));
      plan.push({ visitorId, name: `${row.firstName} ${row.lastName}`, status: change.toStatus, visits: row.visits, add });
    }
  }
  return plan;
}

export async function applyStatusVisits(prisma: PrismaClient, tenantId: string, plan: StatusVisitPlan[]): Promise<number> {
  const data = plan.flatMap((p) => p.add.map((d) => ({ id: randomUUID(), tenantId, visitorId: p.visitorId, visitedOn: dateColumn(d), source: 'BACKFILL_STATUS' })));
  if (data.length === 0) return 0;
  return (await prisma.firstTimerVisit.createMany({ data, skipDuplicates: true })).count;
}

if (require.main === module) {
  runDataScript('backfill-status-visits', async ({ prisma, tenantId, apply }) => {
    const plan = await planStatusVisits(prisma, tenantId);
    console.log(`People to bring up to their approved status: ${plan.length}`);
    for (const p of plan) console.log(`  ${p.name}: ${p.status}, has ${p.visits}, add ${p.add.join(', ') || 'nothing (no free day found)'}`);
    if (!apply) return;
    console.log(`\nAdded ${await applyStatusVisits(prisma, tenantId, plan)} visit(s).`);
  });
}
