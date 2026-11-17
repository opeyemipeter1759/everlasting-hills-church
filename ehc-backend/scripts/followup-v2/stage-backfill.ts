/**
 * Follow-up v2, data step 3 (after backfill-first-visit and
 * backfill-status-visits): give every first-timer the stage that matches the
 * status they read today, so no total moves at cutover.
 *
 * Today's status comes from the old Master List roll (FollowUpRollService):
 * the account's row once they have one, else the form's. Then:
 *   - Integrated becomes CONFIRMED;
 *   - Opted out (on the list, or an account that is not active) becomes OPTED_OUT;
 *   - anyone else is ASSIGNED or UNASSIGNED by whether they have an assignee,
 *     and a working stage they already have (in progress, changes requested,
 *     awaiting approval) is kept.
 * Each change goes through setStage, so it writes a history row, reason BACKFILL.
 *
 * Anyone on record without a follow-up entry gets one in the Follow-Up unit,
 * added by whoever approved their latest status change, or else by a Super
 * Admin found at run time. The new entry is dated on their form, so the old
 * roll reads them the same afterwards and a second run changes nothing.
 *
 *   npx ts-node --transpile-only scripts/followup-v2/stage-backfill.ts            (dry run)
 *   npx ts-node --transpile-only scripts/followup-v2/stage-backfill.ts --apply
 * Tenant: DEFAULT_TENANT_ID, or --tenant=<id>.
 */
import { FollowUpSourceType, FollowUpStage, type PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PipelineRepository } from '../../src/pipeline/pipeline.repository';
import type { PipelineRow } from '../../src/pipeline/pipeline.types';
import { FollowUpAuthService } from '../../src/follow-up/services/follow-up-auth.service';
import { FollowUpRollService } from '../../src/follow-up/services/follow-up-roll.service';
import { FollowUpStatusService } from '../../src/follow-up/services/follow-up-status.service';
import { findFollowUpUnit } from '../../src/follow-up/follow-up-unit.util';
import { setStage } from '../../src/follow-up/stage-transitions';
import { runDataScript } from './data-script';

/** Stages that already say "being worked"; the backfill leaves them alone. */
const KEEP: FollowUpStage[] = [FollowUpStage.ASSIGNED, FollowUpStage.IN_PROGRESS, FollowUpStage.REOPENED, FollowUpStage.AWAITING_REVIEW];

export interface StagePlan {
  visitorId: string;
  name: string;
  /** The status they read on the old Master List today. */
  oldStatus: string;
  entryId: string | null;
  from: FollowUpStage | null;
  to: FollowUpStage;
}

/** The stage a person should hold, from the status they read today. */
export function targetStage(oldStatus: string, accountActive: boolean, current: FollowUpStage | null, hasAssignee: boolean): FollowUpStage {
  if (!accountActive || oldStatus === 'OPTED_OUT') return FollowUpStage.OPTED_OUT;
  if (oldStatus === 'INTEGRATED') return FollowUpStage.CONFIRMED;
  if (hasAssignee && current && KEEP.includes(current)) return current;
  return hasAssignee ? FollowUpStage.ASSIGNED : FollowUpStage.UNASSIGNED;
}

/** Everyone in the pipeline, read in pages. */
async function everyoneOnRecord(pipeline: PipelineRepository): Promise<PipelineRow[]> {
  const rows: PipelineRow[] = [];
  for (let skip = 0; ; skip += 200) {
    const page = await pipeline.list({ take: 200, skip, sort: 'oldest' });
    rows.push(...page.rows);
    if (rows.length >= page.total || page.rows.length === 0) return rows;
  }
}

export async function planStages(prisma: PrismaClient, tenantId: string): Promise<StagePlan[]> {
  const config = { get: () => tenantId } as never;
  const roll = new FollowUpRollService(prisma as never, new FollowUpStatusService(prisma as never, new FollowUpAuthService(prisma as never, config), config), config);
  const pipeline = new PipelineRepository(prisma as never, config);
  const [people, rows] = await Promise.all([everyoneOnRecord(pipeline), roll.everyone()]);
  const statusOf = new Map(rows.map((r) => [`${r.kind}:${r.id}`, r.status]));

  const memberIds = people.flatMap((p) => (p.memberId ? [p.memberId] : []));
  const members = memberIds.length ? await prisma.member.findMany({ where: { id: { in: memberIds } }, select: { id: true, status: true } }) : [];
  const memberStatus = new Map(members.map((m) => [m.id, m.status]));

  const plan: StagePlan[] = [];
  for (const p of people) {
    const oldStatus = (p.memberId ? statusOf.get(`MEMBER:${p.memberId}`) : statusOf.get(`VISITOR:${p.visitorId}`)) ?? 'FIRST_TIMER';
    const accountActive = !p.memberId || memberStatus.get(p.memberId) === 'ACTIVE';
    const from = (p.stage as FollowUpStage | null) ?? null;
    const to = targetStage(oldStatus, accountActive, from, !!p.assigneeId);
    if (p.entryId && from === to) continue;
    plan.push({ visitorId: p.visitorId, name: `${p.firstName} ${p.lastName}`, oldStatus, entryId: p.entryId, from, to });
  }
  return plan;
}

/** Who a new entry is added by: the approver of their latest status change, else any Super Admin. Never a fixed id. */
async function addedByFor(prisma: PrismaClient, tenantId: string, visitorId: string, memberId: string | null, fallback: string): Promise<string> {
  const change = await prisma.followUpStatusChange.findFirst({
    where: {
      tenantId,
      state: 'APPROVED',
      decidedById: { not: null },
      OR: [{ subjectKind: 'VISITOR', subjectId: visitorId }, ...(memberId ? [{ subjectKind: 'MEMBER', subjectId: memberId }] : [])],
    },
    orderBy: { decidedAt: 'desc' },
    select: { decidedById: true },
  });
  return change?.decidedById ?? fallback;
}

export async function applyStages(prisma: PrismaClient, tenantId: string, plan: StagePlan[]): Promise<void> {
  const creates = plan.filter((p) => !p.entryId);
  let unitId: string | null = null;
  let superAdmin: string | null = null;
  if (creates.length) {
    unitId = (await findFollowUpUnit(prisma as never, tenantId))?.id ?? null;
    if (!unitId) throw new Error('No Follow-Up unit found: nobody can be given an entry');
    const grant = await prisma.roleGrant.findFirst({ where: { tenantId, role: 'SUPER_ADMIN', endedAt: null }, orderBy: { grantedAt: 'asc' }, select: { userId: true } });
    if (!grant) throw new Error('No active SUPER_ADMIN grant found to add the new entries');
    superAdmin = grant.userId;
  }

  for (const step of plan) {
    await prisma.$transaction(async (tx) => {
      let entryId = step.entryId;
      if (!entryId) {
        const visitor = await tx.visitor.findUniqueOrThrow({ where: { id: step.visitorId }, select: { submittedAt: true, convertedToMemberId: true } });
        entryId = randomUUID();
        await tx.followUpEntry.create({
          data: {
            id: entryId,
            tenantId,
            unitId: unitId as string,
            sourceType: FollowUpSourceType.FIRST_TIMER,
            visitorId: step.visitorId,
            addedById: await addedByFor(prisma, tenantId, step.visitorId, visitor.convertedToMemberId, superAdmin as string),
            // Dated on their form, so the old roll still reads them the same.
            createdAt: visitor.submittedAt,
          },
        });
      }
      await setStage(tx, { tenantId, entryId, to: step.to, reason: 'BACKFILL', actorId: null });
    });
  }
}

if (require.main === module) {
  runDataScript('stage-backfill', async ({ prisma, tenantId, apply }) => {
    const plan = await planStages(prisma, tenantId);
    const by = (to: string) => plan.filter((p) => p.to === to).length;
    for (const p of plan) {
      console.log(`${p.name.padEnd(30)} reads ${p.oldStatus.padEnd(12)} ${p.entryId ? (p.from ?? 'none') : 'no entry yet'} -> ${p.to}`);
    }
    console.log(`\n${plan.length} to change: ${by('CONFIRMED')} CONFIRMED, ${by('OPTED_OUT')} OPTED_OUT, ${by('ASSIGNED')} ASSIGNED, ${by('UNASSIGNED')} UNASSIGNED (${plan.filter((p) => !p.entryId).length} new entries)`);
    if (apply) {
      await applyStages(prisma, tenantId, plan);
      console.log('Applied.');
    }
  });
}
