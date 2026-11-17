import { FollowUpStage, MemberStatus, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { MemberCrudService } from '../members/services/member-crud.service';
import { MemberBulkOpsService } from '../members/services/member-bulk-ops.service';
import { PipelineRepository } from '../pipeline/pipeline.repository';
import { optOutDeactivated } from './deactivation-stage';
import { FollowUpStageService } from './services/follow-up-stage.service';

/**
 * Deactivating a member opts their follow-up out in the same transaction, and
 * reactivating them puts back the stage they had. Runs against a disposable
 * Postgres with the migrations applied (PIPELINE_TEST_DATABASE_URL); skipped
 * otherwise. It seeds a tenant of its own and deletes it afterwards.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
// A real database, on a laptop often busy with other work: allow it time.
jest.setTimeout(60_000);

maybe('auto opt-out against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const config = { get: () => tenantId } as never;
  const effectiveRoles = { invalidate: jest.fn() } as never;
  const crud = () => new MemberCrudService(prisma as never, effectiveRoles, config);
  const bulk = () => new MemberBulkOpsService(prisma as never, effectiveRoles, config);
  const id = () => randomUUID();
  let unitId: string;
  let adderId: string;
  let assigneeId: string;

  /** A member made from a first-timer form, with a follow-up entry on that form at `stage`. */
  async function convertedFirstTimer(name: string, stage: FollowUpStage) {
    const profile = await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } });
    const member = await prisma.member.create({ data: { id: id(), tenantId, profileId: profile.id, firstName: name, lastName: 'Test' } });
    const visitor = await prisma.visitor.create({
      data: { id: id(), tenantId, firstName: name, lastName: 'Test', convertedAt: new Date(), convertedToMemberId: member.id, firstVisitDate: new Date('2026-03-01T00:00:00Z') },
    });
    const entry = await prisma.followUpEntry.create({
      data: { id: id(), tenantId, unitId, sourceType: 'FIRST_TIMER', visitorId: visitor.id, addedById: adderId, assigneeId, stage },
    });
    return { memberId: member.id, visitorId: visitor.id, entryId: entry.id, userId: profile.userId };
  }

  const stageOf = async (entryId: string) => (await prisma.followUpEntry.findUniqueOrThrow({ where: { id: entryId } })).stage;
  const history = (entryId: string) => prisma.followUpStageHistory.findMany({ where: { entryId }, orderBy: { createdAt: 'asc' } });

  beforeAll(async () => {
    await prisma.tenant.create({ data: { id: tenantId, name: 'Opt-out test', slug: `opt-out-${tenantId}` } });
    adderId = (await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } })).id;
    const assigneeProfile = await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } });
    assigneeId = (await prisma.member.create({ data: { id: id(), tenantId, profileId: assigneeProfile.id, firstName: 'Ruth', lastName: 'Test' } })).id;
    unitId = (await prisma.unit.create({ data: { id: id(), tenantId, name: 'Follow-Up' } })).id;
  });

  afterAll(async () => {
    await prisma.followUpStageHistory.deleteMany({ where: { tenantId } });
    await prisma.followUpEntry.deleteMany({ where: { tenantId } });
    await prisma.auditLog.deleteMany({ where: { tenantId } });
    await prisma.visitor.deleteMany({ where: { tenantId } });
    await prisma.member.deleteMany({ where: { tenantId } });
    await prisma.profile.deleteMany({ where: { tenantId } });
    await prisma.unit.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('opts the follow-up out when the account is deactivated, and puts back the stage before it on reactivation', async () => {
    const p = await convertedFirstTimer('Ada', FollowUpStage.IN_PROGRESS);

    await crud().updateMemberStatus(p.memberId, MemberStatus.INACTIVE, p.userId);
    expect(await stageOf(p.entryId)).toBe(FollowUpStage.OPTED_OUT);
    const [out] = await history(p.entryId);
    expect(out).toMatchObject({ fromStage: 'IN_PROGRESS', toStage: 'OPTED_OUT', reason: 'DEACTIVATED' });

    await crud().updateMemberStatus(p.memberId, MemberStatus.ACTIVE, p.userId);
    expect(await stageOf(p.entryId)).toBe(FollowUpStage.IN_PROGRESS);
    expect((await history(p.entryId))[1]).toMatchObject({ fromStage: 'OPTED_OUT', toStage: 'IN_PROGRESS', reason: 'REACTIVATED' });
  });

  it('writes the opt-out inside the caller transaction: if the deactivation fails, the stage never moved', async () => {
    const p = await convertedFirstTimer('Bola', FollowUpStage.ASSIGNED);

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.member.update({ where: { id: p.memberId }, data: { status: MemberStatus.INACTIVE } });
        await optOutDeactivated(tx, tenantId, [p.memberId], null);
        throw new Error('the deactivation failed after the opt-out');
      }),
    ).rejects.toThrow('the deactivation failed');

    expect(await stageOf(p.entryId)).toBe(FollowUpStage.ASSIGNED);
    expect(await history(p.entryId)).toHaveLength(0);
    expect((await prisma.member.findUniqueOrThrow({ where: { id: p.memberId } })).status).toBe(MemberStatus.ACTIVE);
  });

  it('does the same for a bulk status change, and leaves an already active member alone', async () => {
    const a = await convertedFirstTimer('Chi', FollowUpStage.REOPENED);
    const b = await convertedFirstTimer('Dayo', FollowUpStage.CONFIRMED);

    await bulk().bulkMemberOp({ ids: [a.memberId, b.memberId], op: 'status', value: 'INACTIVE' });
    expect([await stageOf(a.entryId), await stageOf(b.entryId)]).toEqual(['OPTED_OUT', 'OPTED_OUT']);

    await bulk().bulkMemberOp({ ids: [a.memberId, b.memberId], op: 'status', value: 'ACTIVE' });
    expect([await stageOf(a.entryId), await stageOf(b.entryId)]).toEqual(['REOPENED', 'CONFIRMED']);

    // Setting active again changes nothing: they were never away.
    await bulk().bulkMemberOp({ ids: [a.memberId], op: 'status', value: 'ACTIVE' });
    expect(await history(a.entryId)).toHaveLength(2);
  });

  it('keeps someone the team opted out by hand opted out, even when their account comes back', async () => {
    const p = await convertedFirstTimer('Efe', FollowUpStage.ASSIGNED);
    const stages = new FollowUpStageService(
      prisma as never,
      new PipelineRepository(prisma as never, config),
      { canLeadUnit: async () => true, requireAccess: async () => undefined } as never,
      config,
    );

    const row = await stages.optOut({ profileId: adderId, effectiveRoles: [] } as never, p.visitorId);
    expect(row.status).toBe('OPTED_OUT');
    await crud().updateMemberStatus(p.memberId, MemberStatus.INACTIVE, null);
    await crud().updateMemberStatus(p.memberId, MemberStatus.ACTIVE, null);
    expect(await stageOf(p.entryId)).toBe(FollowUpStage.OPTED_OUT);

    const restored = await stages.restore({ profileId: adderId, effectiveRoles: [] } as never, p.visitorId);
    expect(restored.stage).toBe('ASSIGNED');
    expect((await history(p.entryId)).map((h) => h.reason)).toEqual(['OPTED_OUT', 'RESTORED']);
  });
});
