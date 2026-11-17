import { FollowUpStage, Prisma } from '@prisma/client';
import { setStage, stageBeforeOptOut } from './stage-transitions';

type Tx = Prisma.TransactionClient;

/**
 * The follow-up entries of these members: entries on their own member id, and
 * entries on the first-timer form their account was made from.
 */
async function entriesOf(tx: Tx, tenantId: string, memberIds: string[]) {
  if (memberIds.length === 0) return [];
  const forms = await tx.visitor.findMany({
    where: { tenantId, convertedToMemberId: { in: memberIds } },
    select: { id: true },
  });
  return tx.followUpEntry.findMany({
    where: {
      tenantId,
      OR: [{ memberId: { in: memberIds } }, ...(forms.length ? [{ visitorId: { in: forms.map((f) => f.id) } }] : [])],
    },
    select: { id: true, stage: true },
  });
}

/** History rows carry a profile id; the deactivation paths know the signed-in user id. */
async function profileOf(tx: Tx, actorUserId: string | null | undefined): Promise<string | null> {
  if (!actorUserId) return null;
  const profile = await tx.profile.findUnique({ where: { userId: actorUserId }, select: { id: true } });
  return profile?.id ?? null;
}

/**
 * Deactivating someone opts their follow-up out, in the caller's transaction,
 * so the account and the follow-up record can never disagree. An entry that is
 * already opted out is left as it is, so the reason it was opted out survives.
 */
export async function optOutDeactivated(
  tx: Tx,
  tenantId: string,
  memberIds: string[],
  actorUserId: string | null = null,
): Promise<number> {
  const entries = await entriesOf(tx, tenantId, memberIds);
  if (entries.length === 0) return 0;
  const actorId = await profileOf(tx, actorUserId);
  let changed = 0;
  for (const entry of entries) {
    const result = await setStage(tx, { tenantId, entryId: entry.id, to: FollowUpStage.OPTED_OUT, reason: 'DEACTIVATED', actorId });
    if (result.changed) changed += 1;
  }
  return changed;
}

/**
 * Reactivating someone puts their follow-up back on the stage it had before it
 * was opted out. Someone the team opted out by hand (they asked not to be
 * contacted) stays opted out: getting their account back is not a change of mind.
 */
export async function restoreReactivated(
  tx: Tx,
  tenantId: string,
  memberIds: string[],
  actorUserId: string | null = null,
): Promise<number> {
  const entries = (await entriesOf(tx, tenantId, memberIds)).filter((e) => e.stage === FollowUpStage.OPTED_OUT);
  if (entries.length === 0) return 0;
  const actorId = await profileOf(tx, actorUserId);
  let changed = 0;
  for (const entry of entries) {
    const last = await tx.followUpStageHistory.findFirst({
      where: { entryId: entry.id, toStage: FollowUpStage.OPTED_OUT },
      orderBy: { createdAt: 'desc' },
      select: { reason: true },
    });
    if (last?.reason === 'OPTED_OUT') continue;
    const to = await stageBeforeOptOut(tx, entry.id);
    const result = await setStage(tx, { tenantId, entryId: entry.id, to, reason: 'REACTIVATED', actorId });
    if (result.changed) changed += 1;
  }
  return changed;
}

/** Of these members, the ones whose account is not active right now: the ones a reactivation actually brings back. */
export async function inactiveAmong(tx: Tx, tenantId: string, memberIds: string[]): Promise<string[]> {
  if (memberIds.length === 0) return [];
  const rows = await tx.member.findMany({
    where: { tenantId, id: { in: memberIds }, status: { not: 'ACTIVE' } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
