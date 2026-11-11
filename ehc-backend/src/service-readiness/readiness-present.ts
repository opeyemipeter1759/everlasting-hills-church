import type { PrismaService } from '../prisma/prisma.service';
import type { ServiceReadinessPlansService } from './service-readiness-plans.service';

/** The plan, approval, latest status and update history, as the board and a unit leader's page show them. */
export const PLAN_SELECT = {
  state: true, workers: true, equipment: true, done: true, outstanding: true, challenges: true, support: true,
  canMeetDeadline: true, confirmedAt: true, confirmedById: true, approvedAt: true, approvedById: true,
  status: true, blocker: true, statusUpdatedAt: true,
  Updates: { orderBy: { createdAt: 'asc' as const }, select: { status: true, note: true, byId: true, createdAt: true } },
  Tasks: { orderBy: { position: 'asc' as const }, select: { id: true, title: true, done: true, byAdministrator: true } },
} as const;

export const fullName = (m: { firstName: string; lastName: string }) => `${m.firstName} ${m.lastName}`.trim();

type Upcoming = Awaited<ReturnType<ServiceReadinessPlansService['upcoming']>>[number];
export const serviceView = (s: Upcoming) => ({
  id: s.id, name: s.name, serviceType: s.serviceType, scheduledAt: s.scheduledAt,
  readyBy: s.readyBy?.toISOString() ?? null, planDue: s.planDue?.toISOString() ?? null,
  inspections: s.inspections
    ? { DAY_BEFORE: s.inspections.DAY_BEFORE.toISOString(), ON_THE_DAY: s.inspections.ON_THE_DAY.toISOString() }
    : null,
});

type WithPeople = { confirmedById: string | null; approvedById: string | null; Updates: { byId: string | null }[] };

/** Plans with names in place of profile ids, looked up in one query. */
export async function presentPlans<T extends WithPeople>(prisma: PrismaService, records: T[]) {
  const ids = [...new Set(records.flatMap((r) => [r.confirmedById, r.approvedById, ...r.Updates.map((u) => u.byId)]))]
    .filter((id): id is string => !!id);
  const people = ids.length
    ? await prisma.member.findMany({ where: { profileId: { in: ids } }, select: { profileId: true, firstName: true, lastName: true } })
    : [];
  const byProfile = new Map(people.map((p) => [p.profileId, fullName(p)]));
  const nameOf = (id: string | null) => (id ? (byProfile.get(id) ?? null) : null);
  return records.map((r) => {
    const { confirmedById, approvedById, Updates, ...rest } = r;
    return {
      ...rest,
      confirmedBy: nameOf(confirmedById),
      approvedBy: nameOf(approvedById),
      updates: Updates.map(({ byId, ...u }) => ({ ...u, by: nameOf(byId) })),
    };
  });
}
