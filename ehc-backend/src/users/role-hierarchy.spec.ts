import { Role } from '@prisma/client';
import { assignableRoles, canActOnRole } from './role-hierarchy';

describe('role management hierarchy', () => {
  it('does not allow an HOD to manage global grants or Head Usher', () => {
    expect(canActOnRole(Role.HOD, Role.ADMIN)).toBe(false);
    expect(canActOnRole(Role.HOD, Role.HEAD_USHER)).toBe(false);
    expect(assignableRoles(Role.HOD)).toEqual([]);
  });

  it('does not allow a Head Usher or Unit Lead to use global role management', () => {
    expect(canActOnRole(Role.HEAD_USHER, Role.MEMBER)).toBe(false);
    expect(canActOnRole(Role.UNIT_LEAD, Role.MEMBER)).toBe(false);
    expect(assignableRoles(Role.HEAD_USHER)).toEqual([]);
    expect(assignableRoles(Role.UNIT_LEAD)).toEqual([]);
  });

  it('preserves the church-wide hierarchy', () => {
    expect(canActOnRole(Role.ADMIN, Role.HEAD_USHER)).toBe(true);
    expect(canActOnRole(Role.PASTOR, Role.ADMIN)).toBe(true);
    expect(canActOnRole(Role.SUPER_ADMIN, Role.SUPER_ADMIN)).toBe(true);
  });
});
