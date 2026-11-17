/**
 * Follow-up v2: gives someone the first-timer contact role, and sets up a
 * routing rule with its pool. People are passed in, never written here.
 * Idempotent: running it twice changes nothing the second time.
 *
 * Dry run by default (prints what it would do):
 *   npx ts-node --transpile-only scripts/followup-v2/seed-roles-and-routing.ts \
 *     --contact=<profileId> --pool=<memberId,memberId,...> --unit=<unitId> [--name="Students"]
 * Apply:
 *   ... --apply
 *
 * --contact  Profile id of the first-timer contact (FirstTimerContactAssignment).
 * --pool     Member ids of everyone who shares the student first-timers.
 * --unit     The unit the assignments sit under; its lead approves integrations.
 * --name     The rule's name (default "Students").
 * --tenant   Tenant id (default DEFAULT_TENANT_ID from the environment).
 *
 * Either part may be run alone. Reads DATABASE_URL like every other script.
 */
import 'dotenv/config';
import { MemberStatus, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const SEGMENT = 'STUDENT';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3).trim() : undefined;
}

const prisma = new PrismaClient();

async function seedContact(tenantId: string, profileId: string, apply: boolean) {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, tenantId },
    select: { id: true, Member: { select: { firstName: true, lastName: true, status: true } } },
  });
  if (!profile) throw new Error(`No profile ${profileId} in this tenant`);
  const who = profile.Member ? `${profile.Member.firstName} ${profile.Member.lastName} (${profile.Member.status})` : profileId;
  const active = await prisma.firstTimerContactAssignment.findFirst({ where: { tenantId, userId: profileId, endedAt: null } });
  if (active) {
    console.log(`Contact: ${who} is already the first-timer contact. Nothing to do.`);
    return;
  }
  console.log(`Contact: ${apply ? 'giving' : 'would give'} ${who} the first-timer contact role.`);
  if (apply) await prisma.firstTimerContactAssignment.create({ data: { id: randomUUID(), tenantId, userId: profileId } });
}

async function seedRule(tenantId: string, unitId: string, memberIds: string[], name: string, apply: boolean) {
  const unit = await prisma.unit.findFirst({ where: { id: unitId, tenantId }, select: { id: true, name: true } });
  if (!unit) throw new Error(`No unit ${unitId} in this tenant`);
  const members = await prisma.member.findMany({
    where: { id: { in: memberIds }, tenantId },
    select: { id: true, firstName: true, lastName: true, status: true, UnitMember: { where: { unitId }, select: { id: true } } },
  });
  for (const id of memberIds) {
    const m = members.find((x) => x.id === id);
    if (!m) throw new Error(`No member ${id} in this tenant`);
    if (m.status !== MemberStatus.ACTIVE) throw new Error(`${m.firstName} ${m.lastName} is ${m.status}, not ACTIVE`);
    if (m.UnitMember.length === 0) throw new Error(`${m.firstName} ${m.lastName} is not in ${unit.name}; add them to the unit first`);
  }
  const names = members.map((m) => `${m.firstName} ${m.lastName}`).join(', ');

  const existing = await prisma.routingRule.findFirst({
    where: { tenantId, segment: SEGMENT },
    orderBy: { createdAt: 'asc' },
    include: { Members: { select: { memberId: true } } },
  });
  if (!existing) {
    console.log(`Rule: ${apply ? 'creating' : 'would create'} "${name}" (${SEGMENT}, least loaded) under ${unit.name}, pool: ${names}.`);
    if (apply) {
      await prisma.routingRule.create({
        data: {
          id: randomUUID(), tenantId, name, segment: SEGMENT, unitId, strategy: 'LEAST_LOADED', active: true,
          Members: { create: memberIds.map((memberId) => ({ id: randomUUID(), memberId })) },
        },
      });
    }
    return;
  }

  const have = new Set(existing.Members.map((m) => m.memberId));
  const add = memberIds.filter((id) => !have.has(id));
  const remove = [...have].filter((id) => !memberIds.includes(id));
  const changes = [
    existing.name !== name && `name "${existing.name}" to "${name}"`,
    existing.unitId !== unitId && `unit to ${unit.name}`,
    !existing.active && 'switch it on',
    add.length > 0 && `add ${add.length} to the pool`,
    remove.length > 0 && `take ${remove.length} out of the pool`,
  ].filter(Boolean);
  if (changes.length === 0) {
    console.log(`Rule: "${existing.name}" already matches (${unit.name}, pool: ${names}). Nothing to do.`);
    return;
  }
  console.log(`Rule: ${apply ? 'updating' : 'would update'} "${existing.name}": ${changes.join('; ')}.`);
  if (!apply) return;
  await prisma.$transaction(async (tx) => {
    await tx.routingRule.update({ where: { id: existing.id }, data: { name, unitId, active: true } });
    if (remove.length) await tx.routingRuleMember.deleteMany({ where: { ruleId: existing.id, memberId: { in: remove } } });
    if (add.length) await tx.routingRuleMember.createMany({ data: add.map((memberId) => ({ id: randomUUID(), ruleId: existing.id, memberId })) });
  });
}

async function main() {
  const apply = process.argv.includes('--apply');
  const tenantId = arg('tenant') ?? process.env.DEFAULT_TENANT_ID;
  if (!tenantId) throw new Error('Pass --tenant=<id> or set DEFAULT_TENANT_ID');
  const contact = arg('contact');
  const pool = arg('pool');
  const unitId = arg('unit');
  if (!contact && !pool) throw new Error('Nothing to do: pass --contact and/or --pool with --unit');
  if (pool && !unitId) throw new Error('--pool needs --unit');

  const db = new URL(process.env.DATABASE_URL ?? 'postgresql://unknown').host;
  console.log(`${apply ? 'APPLYING' : 'Dry run'} against ${db}, tenant ${tenantId}\n`);

  if (contact) await seedContact(tenantId, contact, apply);
  if (pool && unitId) {
    const memberIds = [...new Set(pool.split(',').map((s) => s.trim()).filter(Boolean))];
    if (memberIds.length === 0) throw new Error('--pool is empty');
    await seedRule(tenantId, unitId, memberIds, arg('name') || 'Students', apply);
  }
  if (!apply) console.log('\nDry run. Re-run with --apply to make these changes.');
}

main()
  .catch((err) => {
    console.error((err as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
