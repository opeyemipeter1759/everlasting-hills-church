import { Role } from '@prisma/client';
import { EffectiveRolesService } from './effective-roles.service';

/**
 * ADMIN_HEAD and HOD are different offices and must stay that way.
 *
 * ADMIN_HEAD is the overall administrator of the church and the application.
 * HOD is the head of one department, overseeing the unit leads under it.
 *
 * Deriving ADMIN_HEAD from a DepartmentHead row conflated them: because
 * ADMIN_HEAD sits in CHURCH_WIDE_ROLES at the same level as ADMIN, heading a
 * single department cleared every @Roles(ADMIN) gate in the application — the
 * member directory, announcements, services, inventory, emails. Two real
 * department heads held church-wide admin that way, with no role grant between
 * them.
 */
function makeService(rows: {
  grants?: Role[];
  unitLeads?: string[];
  deptHeads?: string[];
  deptHods?: string[];
  usher?: boolean;
}) {
  const prisma = {
    roleGrant: { findMany: jest.fn().mockResolvedValue((rows.grants ?? []).map((role) => ({ role }))) },
    unitLeadAssignment: {
      findMany: jest.fn().mockResolvedValue((rows.unitLeads ?? []).map((unitId) => ({ unitId }))),
    },
    departmentHead: {
      findMany: jest.fn().mockResolvedValue((rows.deptHeads ?? []).map((departmentId) => ({ departmentId }))),
    },
    departmentHod: {
      findMany: jest.fn().mockResolvedValue((rows.deptHods ?? []).map((departmentId) => ({ departmentId }))),
    },
    headUsherAssignment: {
      findFirst: jest.fn().mockResolvedValue(rows.usher ? { id: 'u1' } : null),
    },
  };
  return new EffectiveRolesService(prisma as never);
}

describe('EffectiveRolesService', () => {
  it('makes a department head an HOD, never a church-wide admin', async () => {
    const eff = await makeService({ deptHeads: ['dept-1'] }).getEffectiveRoles('p1');

    expect(eff.roles).toContain(Role.HOD);
    expect(eff.roles).not.toContain(Role.ADMIN_HEAD);
    expect(eff.roles).not.toContain(Role.ADMIN);
    expect(eff.hodOf).toEqual(['dept-1']);
  });

  it('treats both assignment tables as the same office', async () => {
    const eff = await makeService({ deptHeads: ['dept-1'], deptHods: ['dept-2'] }).getEffectiveRoles('p2');

    expect(eff.roles).toContain(Role.HOD);
    expect(eff.hodOf.sort()).toEqual(['dept-1', 'dept-2']);
  });

  it('does not list the same department twice when someone holds both rows', async () => {
    const eff = await makeService({ deptHeads: ['dept-1'], deptHods: ['dept-1'] }).getEffectiveRoles('p3');

    expect(eff.hodOf).toEqual(['dept-1']);
  });

  it('grants ADMIN_HEAD only from an actual role grant', async () => {
    const eff = await makeService({ grants: [Role.ADMIN_HEAD] }).getEffectiveRoles('p4');

    expect(eff.roles).toContain(Role.ADMIN_HEAD);
    expect(eff.hodOf).toEqual([]);
  });

  it('lets one person be both, without one implying the other', async () => {
    const eff = await makeService({ grants: [Role.ADMIN_HEAD], deptHeads: ['dept-1'] }).getEffectiveRoles('p5');

    expect(eff.roles).toEqual(expect.arrayContaining([Role.ADMIN_HEAD, Role.HOD, Role.MEMBER]));
    expect(eff.hodOf).toEqual(['dept-1']);
  });

  it('still derives the other assignment roles', async () => {
    const eff = await makeService({ unitLeads: ['unit-1'], usher: true }).getEffectiveRoles('p6');

    expect(eff.roles).toEqual(expect.arrayContaining([Role.UNIT_LEAD, Role.HEAD_USHER]));
    expect(eff.roles).not.toContain(Role.HOD);
  });
});
