import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import type { AuthUser } from '../types/auth-user';

/**
 * RolesGuard tests.
 *
 * Verifies the role-hierarchy invariant: a route requiring PASTOR admits PASTOR and
 * SUPER_ADMIN, rejects ADMIN/UNIT_LEAD/MEMBER, rejects unauthenticated.
 */

function makeContext(user: Partial<AuthUser> | undefined): ExecutionContext {
  const request = user === undefined ? {} : { user };
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function makeReflector(required: Role[] | undefined): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('allows when no @Roles metadata is set (auth-only route)', () => {
    const guard = new RolesGuard(makeReflector(undefined));
    expect(guard.canActivate(makeContext({ role: Role.MEMBER }))).toBe(true);
  });

  it('allows when @Roles is an empty array', () => {
    const guard = new RolesGuard(makeReflector([]));
    expect(guard.canActivate(makeContext({ role: Role.MEMBER }))).toBe(true);
  });

  it('throws ForbiddenException when user has no role', () => {
    const guard = new RolesGuard(makeReflector([Role.MEMBER]));
    expect(() => guard.canActivate(makeContext({ role: null }))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has lower role than required', () => {
    const guard = new RolesGuard(makeReflector([Role.PASTOR]));
    expect(() => guard.canActivate(makeContext({ role: Role.MEMBER }))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(makeContext({ role: Role.UNIT_LEAD }))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(makeContext({ role: Role.ADMIN }))).toThrow(ForbiddenException);
  });

  it('allows when user has exactly the required role', () => {
    const guard = new RolesGuard(makeReflector([Role.PASTOR]));
    expect(guard.canActivate(makeContext({ role: Role.PASTOR }))).toBe(true);
  });

  it('allows when user has a higher role than required (hierarchy)', () => {
    const guard = new RolesGuard(makeReflector([Role.MEMBER]));
    expect(guard.canActivate(makeContext({ role: Role.UNIT_LEAD }))).toBe(true);
    expect(guard.canActivate(makeContext({ role: Role.ADMIN }))).toBe(true);
    expect(guard.canActivate(makeContext({ role: Role.PASTOR }))).toBe(true);
    expect(guard.canActivate(makeContext({ role: Role.SUPER_ADMIN }))).toBe(true);
  });

  it('admits SUPER_ADMIN to PASTOR-only routes (full hierarchy)', () => {
    const guard = new RolesGuard(makeReflector([Role.PASTOR]));
    expect(guard.canActivate(makeContext({ role: Role.SUPER_ADMIN }))).toBe(true);
  });
});
