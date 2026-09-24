import { Role } from '@prisma/client';
import { DepartmentsMyUnitsService } from './departments-my-units.service';
import type { DepartmentsScopeService } from './departments-scope.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../auth/types/auth-user';

/**
 * Who sees which units in a department-led sidebar section: a member only the
 * units they serve in, a department's Admin Head/HOD every unit under it, a
 * church-wide admin all of them.
 */
function makeUser(role: Role, extra: Partial<AuthUser> = {}): AuthUser {
  return {
    userId: 'u1',
    email: 'a@b.c',
    role,
    effectiveRoles: [role],
    unitLeadOf: [],
    hodOf: [],
    headUsher: false,
    profileId: 'p1',
    memberId: 'm1',
    tenantId: 't1',
    ...extra,
  };
}

const ASSIMILATION = { id: 'd1', name: 'Membership and Assimilation', sortOrder: 1 };
const MUSIC = { id: 'd2', name: 'Music', sortOrder: 2 };

function makeService(units: unknown[], ledDeptIds: string[] = []) {
  const findMany = jest.fn().mockResolvedValue(units);
  const prisma = { unit: { findMany } } as unknown as PrismaService;
  const scope = { myActiveDeptIds: jest.fn().mockResolvedValue(ledDeptIds) } as unknown as DepartmentsScopeService;
  const config = { get: () => 't1' } as never;
  return { service: new DepartmentsMyUnitsService(prisma, scope, config), findMany, scope };
}

describe('DepartmentsMyUnitsService', () => {
  it('asks only for the units a plain member serves in', async () => {
    const { service, findMany } = makeService([
      { id: 'unit-1', name: 'Welcome Team', Department: ASSIMILATION, UnitMember: [{ id: 'um1' }] },
    ]);

    const result = await service.getMine(makeUser(Role.MEMBER));

    expect(findMany.mock.calls[0][0].where.OR).toEqual([{ UnitMember: { some: { memberId: 'm1' } } }]);
    expect(result).toEqual([
      {
        department: { id: 'd1', name: 'Membership and Assimilation' },
        units: [{ id: 'unit-1', name: 'Welcome Team', isMember: true }],
      },
    ]);
  });

  it("includes every unit of a department the person heads, even ones they're not in", async () => {
    const { service, findMany } = makeService(
      [
        { id: 'unit-1', name: 'Welcome Team', Department: ASSIMILATION, UnitMember: [{ id: 'um1' }] },
        { id: 'unit-2', name: 'New Members Class', Department: ASSIMILATION, UnitMember: [] },
      ],
      ['d1'],
    );

    const result = await service.getMine(makeUser(Role.HOD));

    expect(findMany.mock.calls[0][0].where.OR).toEqual([
      { UnitMember: { some: { memberId: 'm1' } } },
      { departmentId: { in: ['d1'] } },
    ]);
    expect(result[0].units).toEqual([
      { id: 'unit-1', name: 'Welcome Team', isMember: true },
      { id: 'unit-2', name: 'New Members Class', isMember: false },
    ]);
  });

  it('gives a church-wide admin every unit, without a department lookup', async () => {
    const { service, findMany, scope } = makeService([
      { id: 'unit-1', name: 'Welcome Team', Department: ASSIMILATION, UnitMember: [] },
      { id: 'unit-9', name: 'Choir', Department: MUSIC, UnitMember: [] },
    ]);

    const result = await service.getMine(makeUser(Role.ADMIN));

    expect(scope.myActiveDeptIds).not.toHaveBeenCalled();
    expect(findMany.mock.calls[0][0].where).toEqual({ tenantId: 't1' });
    expect(result.map((d) => d.department.name)).toEqual(['Membership and Assimilation', 'Music']);
  });

  it('leaves out units that belong to no department', async () => {
    const { service } = makeService([
      { id: 'unit-1', name: 'Welcome Team', Department: ASSIMILATION, UnitMember: [{ id: 'um1' }] },
      { id: 'unit-x', name: 'Unassigned crew', Department: null, UnitMember: [{ id: 'um2' }] },
    ]);

    const result = await service.getMine(makeUser(Role.MEMBER));

    expect(result).toHaveLength(1);
    expect(result[0].units).toHaveLength(1);
  });

  it('returns nothing for someone with no member record and no department', async () => {
    const { service, findMany } = makeService([]);

    const result = await service.getMine(makeUser(Role.MEMBER, { memberId: null }));

    expect(result).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
