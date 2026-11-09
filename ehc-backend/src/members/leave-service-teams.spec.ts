import { leaveServiceTeams } from './leave-service-teams';

const JOINED = new Date('2026-03-01T09:00:00Z');

function db(o: { memberships?: unknown[]; leads?: unknown[] } = {}) {
  return {
    member: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'm1', profileId: 'p1' },
        { id: 'm2', profileId: 'p2' },
      ]),
    },
    unitMember: {
      findMany: jest.fn().mockResolvedValue(o.memberships ?? []),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    auditLog: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    unitLeadAssignment: {
      findMany: jest.fn().mockResolvedValue(o.leads ?? []),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

const membership = (memberId: string, unitName: string, o: Record<string, unknown> = {}) => ({
  memberId,
  unitId: `u-${unitName}`,
  isLead: false,
  isAssistant: false,
  positionId: null,
  joinedAt: JOINED,
  Unit: { name: unitName },
  ...o,
});

describe('leaveServiceTeams', () => {
  it('takes members off every team, noting the teams each one left', async () => {
    const tx = db({ memberships: [membership('m1', 'Choir'), membership('m1', 'Media', { isAssistant: true }), membership('m2', 'Ushers')] });

    await leaveServiceTeams(tx as never, 't1', ['m1', 'm2'], 'admin-user');

    expect(tx.unitMember.deleteMany).toHaveBeenCalledWith({ where: { tenantId: 't1', memberId: { in: ['m1', 'm2'] } } });
    const logged = tx.auditLog.createMany.mock.calls[0][0].data;
    expect(logged).toHaveLength(2);
    expect(logged[0]).toMatchObject({ tenantId: 't1', actorId: 'admin-user', action: 'LEFT_SERVICE_TEAMS', entity: 'Member', entityId: 'm1' });
    expect(logged[0].before.teams.map((t: { unitName: string }) => t.unitName)).toEqual(['Choir', 'Media']);
    expect(logged[0].before.teams[1]).toMatchObject({ isAssistant: true, joinedAt: JOINED.toISOString() });
    expect(logged[1]).toMatchObject({ entityId: 'm2' });
  });

  it('ends the lead assignments they hold and returns whose roles changed', async () => {
    const tx = db({
      memberships: [membership('m1', 'Choir', { isLead: true })],
      leads: [{ id: 'l1', userId: 'p1' }, { id: 'l2', userId: 'p1' }],
    });

    const changed = await leaveServiceTeams(tx as never, 't1', ['m1', 'm2']);

    expect(tx.unitLeadAssignment.findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1', userId: { in: ['p1', 'p2'] }, endedAt: null },
      select: { id: true, userId: true },
    });
    expect(tx.unitLeadAssignment.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['l1', 'l2'] } }, data: { endedAt: expect.any(Date) } });
    expect(changed).toEqual(['p1']);
  });

  it('leaves everything alone for someone on no team', async () => {
    const tx = db();

    await expect(leaveServiceTeams(tx as never, 't1', ['m1'])).resolves.toEqual([]);

    expect(tx.auditLog.createMany).not.toHaveBeenCalled();
    expect(tx.unitMember.deleteMany).not.toHaveBeenCalled();
    expect(tx.unitLeadAssignment.updateMany).not.toHaveBeenCalled();
  });
});
