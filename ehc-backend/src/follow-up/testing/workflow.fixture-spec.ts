import { FollowUpStage, PrismaClient, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthUser } from '../../auth/types/auth-user';
import { OutboxRegistry } from '../../outbox/outbox.registry';
import { OutboxService } from '../../outbox/outbox.service';
import { PipelineRepository } from '../../pipeline/pipeline.repository';
import { FollowUpAuthService } from '../services/follow-up-auth.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { FollowUpEventsRegistrar } from '../events/follow-up-events.registrar';

/**
 * Shared set-up for the follow-up workflow's database specs: a tenant of its
 * own on the disposable Postgres, people and units, and the real services.
 * Named so the build and Jest both leave it alone.
 */
export const testDbUrl = process.env.PIPELINE_TEST_DATABASE_URL;

export interface Person {
  profileId: string;
  memberId: string;
}

export function workflowFixture(prisma: PrismaClient) {
  const tenantId = randomUUID();
  const id = () => randomUUID();

  const fx = {
    tenantId,
    id,
    async init() {
      await prisma.tenant.create({ data: { id: tenantId, name: 'Workflow test', slug: `workflow-${tenantId}` } });
    },
    async person(firstName: string, opts: { unitIds?: string[]; roles?: Role[] } = {}): Promise<Person> {
      const profileId = (await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } })).id;
      const memberId = (await prisma.member.create({ data: { id: id(), tenantId, profileId, firstName, lastName: 'Staffperson' } })).id;
      for (const unitId of opts.unitIds ?? []) await prisma.unitMember.create({ data: { id: id(), tenantId, unitId, memberId } });
      for (const role of opts.roles ?? []) await prisma.roleGrant.create({ data: { id: id(), tenantId, userId: profileId, role } });
      return { profileId, memberId };
    },
    async department(name: string) {
      return (await prisma.department.create({ data: { id: id(), tenantId, code: `D${Math.floor(Math.random() * 1e8)}`, name } })).id;
    },
    async unit(name: string, departmentId?: string) {
      return (await prisma.unit.create({ data: { id: id(), tenantId, name, departmentId: departmentId ?? null } })).id;
    },
    async lead(unitId: string, profileId: string) {
      return (await prisma.unitLeadAssignment.create({ data: { id: id(), tenantId, unitId, userId: profileId } })).id;
    },
    async head(departmentId: string, profileId: string) {
      await prisma.departmentHead.create({ data: { id: id(), tenantId, departmentId, userId: profileId } });
    },
    /** A first-timer with a surname and a prayer request that must never reach a notification. */
    async firstTimer(firstName: string, extra: Record<string, unknown> = {}) {
      return (
        await prisma.visitor.create({
          data: {
            id: id(), tenantId, firstName, lastName: 'Okonkwo-Secret', phone: `080${Math.floor(Math.random() * 1e8)}`,
            prayerPoint: 'Pray about my private family matter', firstVisitDate: new Date('2026-01-04T00:00:00Z'), ...extra,
          },
        })
      ).id;
    },
    async entry(visitorId: string, unitId: string, addedById: string, assigneeId: string | null, stage: FollowUpStage = FollowUpStage.ASSIGNED, assignedAt?: Date) {
      return (
        await prisma.followUpEntry.create({
          data: { id: id(), tenantId, unitId, sourceType: 'FIRST_TIMER', visitorId, addedById, assigneeId, stage, assignedAt: assignedAt ?? null },
        })
      ).id;
    },
    actor(p: Person, o: { roles?: Role[]; unitLeadOf?: string[]; hodOf?: string[] } = {}): AuthUser {
      return {
        userId: p.profileId, email: 'test@example.com', role: o.roles?.[0] ?? Role.MEMBER,
        effectiveRoles: [Role.MEMBER, ...(o.roles ?? []), ...(o.unitLeadOf?.length ? [Role.UNIT_LEAD] : [])],
        unitLeadOf: o.unitLeadOf ?? [], hodOf: o.hodOf ?? [], headUsher: false,
        profileId: p.profileId, memberId: p.memberId, tenantId,
      };
    },
    services() {
      const config = { get: () => tenantId } as never;
      const registry = new OutboxRegistry();
      const push = { dispatch: jest.fn().mockResolvedValue({}) };
      const outbox = new OutboxService(prisma as never, registry, push as never);
      new FollowUpEventsRegistrar(prisma as never, registry).onModuleInit();
      const pipeline = new PipelineRepository(prisma as never, config);
      const auth = new FollowUpAuthService(prisma as never, config);
      const approvals = new ApprovalsService(prisma as never, outbox, pipeline, auth, config);
      return { config, registry, push, outbox, pipeline, auth, approvals };
    },
    async cleanup() {
      const t = { where: { tenantId } };
      await prisma.notification.deleteMany(t);
      await prisma.outboxEvent.deleteMany(t);
      await prisma.approvalRequest.deleteMany(t);
      await prisma.followUpStageHistory.deleteMany(t);
      await prisma.auditLog.deleteMany(t);
      await prisma.routingRule.deleteMany(t);
      await prisma.firstTimerContactAssignment.deleteMany(t);
      await prisma.followUpEntry.deleteMany(t);
      await prisma.firstTimerVisit.deleteMany(t);
      await prisma.visitor.deleteMany(t);
      await prisma.unitLeadAssignment.deleteMany(t);
      await prisma.departmentHead.deleteMany(t);
      await prisma.departmentHod.deleteMany(t);
      await prisma.roleGrant.deleteMany(t);
      await prisma.unitMember.deleteMany(t);
      await prisma.member.deleteMany(t);
      await prisma.profile.deleteMany(t);
      await prisma.unit.deleteMany(t);
      await prisma.department.deleteMany(t);
      await prisma.tenant.deleteMany({ where: { id: tenantId } });
    },
  };
  return fx;
}
