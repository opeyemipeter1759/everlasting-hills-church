/** jwks-rsa pulls in ESM-only jose, so unit tests replace only its key provider. */
jest.mock('jwks-rsa', () => ({
  passportJwtSecret: () => () => undefined,
}));

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

function makeStrategy(profileFinder: jest.Mock, effectiveRole: Role = Role.MEMBER) {
  const config = {
    get: jest.fn().mockReturnValue('https://supabase.example.com'),
  } as unknown as ConfigService;
  const prisma = {
    profile: { findUnique: profileFinder },
  } as unknown as PrismaService;
  const effectiveRoles = {
    getEffectiveRoles: jest.fn().mockResolvedValue({
      roles: [effectiveRole],
      unitLeadOf: [],
      adminHeadOf: [],
      hodOf: [],
      headUsher: false,
      primaryRole: effectiveRole,
    }),
  };
  return new JwtStrategy(config as never, prisma, effectiveRoles as never);
}

describe('JwtStrategy', () => {
  it('configures passport-jwt to reject expired access tokens', () => {
    const strategy = makeStrategy(jest.fn());
    expect((strategy as unknown as { _verifOpts: { ignoreExpiration: boolean } })._verifOpts)
      .toMatchObject({ ignoreExpiration: false });
  });

  it('throws when token has no sub claim', async () => {
    const finder = jest.fn();
    const strategy = makeStrategy(finder);
    await expect(strategy.validate({} as never)).rejects.toThrow(UnauthorizedException);
    expect(finder).not.toHaveBeenCalled();
  });

  it('returns an identity with no application role when no Profile exists', async () => {
    const finder = jest.fn().mockResolvedValue(null);
    const strategy = makeStrategy(finder);
    const result = await strategy.validate({
      sub: 'user-uuid-123',
      email: 'orphan@example.com',
    } as never);

    expect(result).toEqual({
      userId: 'user-uuid-123',
      email: 'orphan@example.com',
      role: null,
      effectiveRoles: [],
      unitLeadOf: [],
      adminHeadOf: [],
      hodOf: [],
      headUsher: false,
      profileId: null,
      memberId: null,
      tenantId: null,
    });
  });

  it('returns live effective roles with Profile and Member identity', async () => {
    const finder = jest.fn().mockResolvedValue({
      id: 'profile-1',
      tenantId: 'tenant-1',
      Member: { id: 'member-1' },
    });
    const strategy = makeStrategy(finder, Role.ADMIN);
    const result = await strategy.validate({
      sub: 'user-uuid-123',
      email: 'admin@example.com',
    } as never);

    expect(result).toEqual({
      userId: 'user-uuid-123',
      email: 'admin@example.com',
      role: Role.ADMIN,
      effectiveRoles: [Role.ADMIN],
      unitLeadOf: [],
      adminHeadOf: [],
      hodOf: [],
      headUsher: false,
      profileId: 'profile-1',
      memberId: 'member-1',
      tenantId: 'tenant-1',
    });
  });

  it('handles a missing email claim', async () => {
    const strategy = makeStrategy(jest.fn().mockResolvedValue(null));
    const result = await strategy.validate({ sub: 'user-uuid' } as never);
    expect(result.email).toBe('');
  });
});
