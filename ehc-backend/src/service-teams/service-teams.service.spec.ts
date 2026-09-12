import { ServiceTeamsService } from './service-teams.service';

/**
 * The two things this screen gets wrong if nobody holds it still:
 *
 *   1. Filtering by department quietly strips a person's other teams off their
 *      row, so somebody serving in two departments looks like they serve in one
 *      — which is the exact fact the screen exists to surface.
 *   2. The headline counts start obeying the filter, so picking a department
 *      makes it read as though the church shrank.
 */

const UNITS = [
  { id: 'u-ushers', name: 'Ushering Team', Department: { id: 'd-ops', name: 'Operations' } },
  { id: 'u-worship', name: 'Worship Team', Department: { id: 'd-ops', name: 'Operations' } },
  { id: 'u-followup', name: 'Follow-Up', Department: { id: 'd-assim', name: 'Assimilation' } },
];

function membership(
  id: string,
  unit: (typeof UNITS)[number],
  opts: { isLead?: boolean; isAssistant?: boolean; position?: string } = {},
) {
  return {
    id,
    isLead: opts.isLead ?? false,
    isAssistant: opts.isAssistant ?? false,
    joinedAt: new Date('2026-01-01'),
    Position: opts.position ? { id: `p-${opts.position}`, name: opts.position } : null,
    Unit: unit,
  };
}

const GRACE = {
  id: 'm-grace',
  profileId: 'p-grace',
  firstName: 'Grace',
  lastName: 'Adeyemi',
  email: 'grace@example.com',
  phone: null,
  photoUrl: null,
  status: 'ACTIVE',
  joinedAt: new Date('2025-06-01'),
  // Leads ushering, and also serves on follow-up in another department.
  UnitMember: [
    membership('um-1', UNITS[0], { isLead: true }),
    membership('um-2', UNITS[2]),
  ],
};

const SAMUEL = {
  ...GRACE,
  id: 'm-samuel',
  profileId: 'p-samuel',
  firstName: 'Samuel',
  lastName: 'Okoro',
  email: null,
  UnitMember: [membership('um-3', UNITS[1], { position: 'Secretary' })],
};

function makeService(members: unknown[], counts = { serving: 2, active: 80 }) {
  const prisma = {
    member: {
      findMany: jest.fn(async () => members),
      count: jest.fn(async ({ where }: { where: Record<string, unknown> }) =>
        where.UnitMember ? counts.serving : counts.active,
      ),
    },
    unit: {
      findMany: jest.fn(async () =>
        UNITS.map((u) => ({
          ...u,
          _count: { UnitMember: u.id === 'u-ushers' ? 1 : u.id === 'u-worship' ? 1 : 1 },
          // Only ushering has a lead.
          UnitMember: u.id === 'u-ushers' ? [{ id: 'um-1' }] : [],
        })),
      ),
    },
  };

  return {
    service: new ServiceTeamsService(prisma as never, {
      get: jest.fn().mockReturnValue('tenant-1'),
    } as never),
    prisma,
  };
}

describe('the roster', () => {
  it('gathers every team a person serves on onto one row', async () => {
    const { service } = makeService([GRACE, SAMUEL]);
    const { people } = await service.roster({});

    const grace = people.find((p) => p.memberId === 'm-grace')!;
    expect(grace.teamCount).toBe(2);
    expect(grace.teams.map((t) => t.unitName)).toEqual(['Follow-Up', 'Ushering Team']);
  });

  it('counts leading from the membership, not from a role grant', async () => {
    // Somebody leading a team today is a leader here even if the UNIT_LEAD
    // grant has not caught up.
    const { service } = makeService([GRACE, SAMUEL]);
    const { people } = await service.roster({});

    expect(people.find((p) => p.memberId === 'm-grace')!.leadsCount).toBe(1);
    expect(people.find((p) => p.memberId === 'm-samuel')!.leadsCount).toBe(0);
  });

  it('falls back to the named position when somebody is neither lead nor assistant', async () => {
    const { service } = makeService([SAMUEL]);
    const { people } = await service.roster({});
    expect(people[0].teams[0].positionName).toBe('Secretary');
  });
});

describe('filtering', () => {
  it('keeps a person\'s other teams on the row, and marks which one matched', async () => {
    // Grace matched on Ushering. Follow-Up is still hers and still shown, just
    // not marked — dropping it would hide that she serves in two departments.
    const { service } = makeService([GRACE]);
    const { people } = await service.roster({ departmentId: 'd-ops' });

    const grace = people[0];
    expect(grace.teams).toHaveLength(2);
    expect(grace.teams.find((t) => t.unitName === 'Ushering Team')!.matchesFilter).toBe(true);
    expect(grace.teams.find((t) => t.unitName === 'Follow-Up')!.matchesFilter).toBe(false);
  });

  it('marks only the led team when filtering on leads', async () => {
    const { service } = makeService([GRACE]);
    const { people } = await service.roster({ role: 'LEAD' });

    expect(people[0].teams.filter((t) => t.matchesFilter).map((t) => t.unitName)).toEqual([
      'Ushering Team',
    ]);
  });

  it('narrows the database query rather than filtering in memory', async () => {
    const { service, prisma } = makeService([GRACE]);
    await service.roster({ unitId: 'u-worship', role: 'ASSISTANT' });

    const where = (prisma.member.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.UnitMember.some).toEqual({ unitId: 'u-worship', isAssistant: true });
  });

  it('treats a plain member as neither lead nor assistant', async () => {
    const { service, prisma } = makeService([SAMUEL]);
    await service.roster({ role: 'MEMBER' });

    const where = (prisma.member.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.UnitMember.some).toEqual({ isLead: false, isAssistant: false });
  });
});

describe('the headline counts', () => {
  it('reports serving church-wide even when the list is filtered', async () => {
    // Picking a department must not make the church look smaller.
    const { service } = makeService([GRACE], { serving: 40, active: 80 });
    const filtered = await service.roster({ departmentId: 'd-ops' });

    expect(filtered.stats.serving).toBe(40);
    expect(filtered.stats.activeMembers).toBe(80);
    expect(filtered.stats.notServing).toBe(40);
    // Only `matched` follows the filter.
    expect(filtered.stats.matched).toBe(1);
  });

  it('never reports a negative number of people not serving', async () => {
    // Serving counts every member with a team; active counts ACTIVE ones. A
    // team full of people marked INACTIVE can push serving above active.
    const { service } = makeService([GRACE], { serving: 90, active: 80 });
    const { stats } = await service.roster({});
    expect(stats.notServing).toBe(0);
  });

  it('counts teams with no lead, which is the number worth acting on', async () => {
    const { service } = makeService([GRACE, SAMUEL]);
    const { stats, teams } = await service.roster({});

    expect(stats.teamCount).toBe(3);
    expect(stats.teamsWithoutLead).toBe(2);
    expect(teams.find((t) => t.id === 'u-ushers')!.hasLead).toBe(true);
    expect(teams.find((t) => t.id === 'u-worship')!.hasLead).toBe(false);
  });

  it('counts people serving on more than one team', async () => {
    const { service } = makeService([GRACE, SAMUEL]);
    const { stats } = await service.roster({});
    expect(stats.servingInMoreThanOne).toBe(1);
  });
});
