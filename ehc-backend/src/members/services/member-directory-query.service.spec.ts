import { MemberStatus } from '@prisma/client';
import { MemberDirectoryQueryService } from './member-directory-query.service';

function makeService() {
  const prisma = {
    member: { count: jest.fn().mockResolvedValue(0) },
    roleGrant: { findMany: jest.fn().mockResolvedValue([]) },
    unitLeadAssignment: { findMany: jest.fn().mockResolvedValue([]) },
    departmentHead: { findMany: jest.fn().mockResolvedValue([]) },
    departmentHod: { findMany: jest.fn().mockResolvedValue([]) },
    headUsherAssignment: { findMany: jest.fn().mockResolvedValue([]) },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
  const config = { get: jest.fn().mockReturnValue('tenant-1') };
  return {
    service: new MemberDirectoryQueryService(prisma as never, config as never),
    prisma,
  };
}

describe('MemberDirectoryQueryService', () => {
  beforeEach(() => jest.clearAllMocks());

  // Deactivating somebody takes them out of the membership. If the default
  // listing still showed them, "deactivated" would mean nothing but a badge.
  it('lists active members when no status is asked for', async () => {
    const { service } = makeService();

    const where = await service.buildWhere({});

    expect(where.status).toBe(MemberStatus.ACTIVE);
  });

  it('gives the deactivated feed every non-active state, not just INACTIVE', async () => {
    const { service } = makeService();

    const where = await service.buildWhere({ status: MemberStatus.INACTIVE });

    // Legacy TRANSFERRED / DECEASED / OPTED_OUT rows belong in this feed too —
    // an equality check on INACTIVE would strand them in neither list.
    expect(where.status).toEqual({ not: MemberStatus.ACTIVE });
  });

  it('still allows asking for everyone at once', async () => {
    const { service } = makeService();

    const where = await service.buildWhere({ status: 'all' });

    expect(where.status).toBeUndefined();
  });

  it('keeps other filters working alongside the active default', async () => {
    const { service } = makeService();

    const where = await service.buildWhere({ gender: 'female', hasUnit: 'false' });

    expect(where.status).toBe(MemberStatus.ACTIVE);
    expect(where.gender).toBe('FEMALE');
    expect(where.UnitMember).toEqual({ none: {} });
  });

  // The strip above the table must not fold deactivated people back into the
  // membership total it reports.
  it('counts the membership as active only and the deactivated separately', async () => {
    const { service, prisma } = makeService();
    prisma.member.count
      .mockResolvedValueOnce(12) // active
      .mockResolvedValueOnce(8) // withUnit
      .mockResolvedValueOnce(2) // thisMonth
      .mockResolvedValueOnce(12) // total
      .mockResolvedValueOnce(3); // deactivated

    const counts = await service.directoryCounts();

    expect(counts.total).toBe(12);
    expect(counts.deactivated).toBe(3);
    expect(counts.byRole.MEMBER).toBe(12);
    for (const call of prisma.member.count.mock.calls.slice(0, 4)) {
      expect(call[0].where.status).toBe(MemberStatus.ACTIVE);
    }
    expect(prisma.member.count.mock.calls[4][0].where.status).toEqual({
      not: MemberStatus.ACTIVE,
    });
  });
});
