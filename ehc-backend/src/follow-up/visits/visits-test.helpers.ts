import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthUser } from '../../auth/types/auth-user';

/**
 * A throwaway tenant for the DB-backed visit and Overview specs. Everything is
 * created under its own tenant id and deleted by cleanup(), so the specs can
 * share a disposable database with other suites.
 */
export function visitsTestTenant(prisma: PrismaClient) {
  const tenantId = randomUUID();
  const id = () => randomUUID();
  let profileId = '';
  let unitId = '';

  const day = (d: string) => new Date(`${d}T00:00:00Z`);

  return {
    tenantId,
    get profileId() {
      return profileId;
    },
    actor(): AuthUser {
      return { userId: id(), email: 'staff@test.local', role: null, effectiveRoles: [], unitLeadOf: [], hodOf: [], headUsher: false, profileId, memberId: null, tenantId };
    },
    config: { get: () => tenantId } as never,

    async setup() {
      await prisma.tenant.create({ data: { id: tenantId, name: 'Visits test', slug: `visits-${tenantId}` } });
      profileId = (await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } })).id;
      unitId = (await prisma.unit.create({ data: { id: id(), tenantId, name: 'Follow-Up' } })).id;
    },

    /** A first-timer form and, as the form now records it, its FORM visit (`form: false` for a legacy row without one). */
    async visitor(o: { first: string; firstVisit: string; phone?: string; form?: boolean; extra?: Record<string, unknown> }) {
      const v = await prisma.visitor.create({
        data: {
          id: id(), tenantId, firstName: o.first, lastName: 'Test',
          phone: o.phone ?? `080${Math.floor(1e7 + Math.random() * 9e7)}`,
          submittedAt: new Date(`${o.firstVisit}T09:00:00Z`),
          firstVisitDate: day(o.firstVisit),
          ...(o.extra ?? {}),
        },
      });
      if (o.form !== false) {
        await prisma.firstTimerVisit.create({ data: { id: id(), tenantId, visitorId: v.id, visitedOn: day(o.firstVisit), source: 'FORM' } });
      }
      return v.id;
    },

    async statusChange(o: { kind: 'VISITOR' | 'MEMBER'; subjectId: string; to: string; state?: string; requestedAt: string; decidedAt?: string }) {
      await prisma.followUpStatusChange.create({
        data: {
          id: id(), tenantId, subjectKind: o.kind, subjectId: o.subjectId, fromStatus: 'FIRST_TIMER', toStatus: o.to,
          state: o.state ?? 'APPROVED', requestedById: profileId, requestedAt: new Date(o.requestedAt),
          decidedAt: o.decidedAt ? new Date(o.decidedAt) : null,
        },
      });
    },

    async visit(visitorId: string, on: string, source = 'CAME_AGAIN') {
      await prisma.firstTimerVisit.create({ data: { id: id(), tenantId, visitorId, visitedOn: day(on), source } });
    },

    async member(first: string, status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE') {
      const profile = await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } });
      return (await prisma.member.create({ data: { id: id(), tenantId, profileId: profile.id, firstName: first, lastName: 'Test', status } })).id;
    },

    async service(at: string, extra: Record<string, unknown> = {}) {
      return (await prisma.service.create({ data: { id: id(), tenantId, name: 'Sunday service', scheduledAt: new Date(at), ...extra } })).id;
    },

    async attend(memberId: string, serviceId: string, present = true) {
      await prisma.attendanceRecord.create({ data: { id: id(), tenantId, memberId, serviceId, present } });
    },

    async entry(visitorId: string, stage: string) {
      await prisma.followUpEntry.create({
        data: { id: id(), tenantId, unitId, sourceType: 'FIRST_TIMER', visitorId, addedById: profileId, stage: stage as never },
      });
    },

    async cleanup() {
      const where = { tenantId };
      await prisma.attendanceRecord.deleteMany({ where });
      await prisma.followUpStatusChange.deleteMany({ where });
      await prisma.followUpNote.deleteMany({ where });
      await prisma.auditLog.deleteMany({ where });
      await prisma.followUpEntry.deleteMany({ where });
      await prisma.firstTimerVisit.deleteMany({ where });
      await prisma.visitor.deleteMany({ where });
      await prisma.service.deleteMany({ where });
      await prisma.member.deleteMany({ where });
      await prisma.profile.deleteMany({ where });
      await prisma.unit.deleteMany({ where });
      await prisma.tenant.delete({ where: { id: tenantId } });
    },
  };
}
