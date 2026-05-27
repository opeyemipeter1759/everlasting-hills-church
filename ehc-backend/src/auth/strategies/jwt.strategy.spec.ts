/**
 * jwks-rsa pulls in `jose` (ESM-only) which Jest's default CommonJS transform cannot load.
 * Mock at module level — passportJwtSecret returns a no-op key provider that's never
 * actually called because our tests skip cryptographic verification.
 */
jest.mock('jwks-rsa', () => ({
  passportJwtSecret: () => () => undefined,
}));

import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * Tests for JwtStrategy.validate — the function passport-jwt calls AFTER signature/expiry
 * verification succeed. Our job is to translate the verified payload into our AuthUser shape.
 *
 * We don't test the cryptographic verification itself — that's passport-jwt's contract.
 * We test our domain logic: payload→AuthUser mapping, profile lookup, error cases.
 */

function makeStrategy(profileFinder: jest.Mock) {
  const config = {
    get: jest.fn().mockReturnValue('https://supabase.example.com'),
  } as unknown as ConfigService;
  const prisma = {
    profile: { findUnique: profileFinder },
  } as unknown as PrismaService;
  // Cast through unknown so we don't need to construct the full Passport machinery for tests.
  return new JwtStrategy(config as never, prisma);
}

describe('JwtStrategy.validate', () => {
  it('throws when token has no sub claim', async () => {
    const finder = jest.fn();
    const strategy = makeStrategy(finder);
    await expect(strategy.validate({} as never)).rejects.toThrow(UnauthorizedException);
    expect(finder).not.toHaveBeenCalled();
  });

  it('returns AuthUser with null role when no Profile exists', async () => {
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
      profileId: null,
      memberId: null,
      tenantId: null,
    });
    expect(finder).toHaveBeenCalledWith({
      where: { userId: 'user-uuid-123' },
      select: expect.any(Object),
    });
  });

  it('returns AuthUser fully populated when Profile + Member exist', async () => {
    const finder = jest.fn().mockResolvedValue({
      id: 'profile-1',
      role: Role.ADMIN,
      tenantId: 'tenant-1',
      Member: { id: 'member-1' },
    });
    const strategy = makeStrategy(finder);

    const result = await strategy.validate({
      sub: 'user-uuid-123',
      email: 'admin@example.com',
    } as never);

    expect(result).toEqual({
      userId: 'user-uuid-123',
      email: 'admin@example.com',
      role: Role.ADMIN,
      profileId: 'profile-1',
      memberId: 'member-1',
      tenantId: 'tenant-1',
    });
  });

  it('handles missing email in JWT payload gracefully', async () => {
    const finder = jest.fn().mockResolvedValue(null);
    const strategy = makeStrategy(finder);

    const result = await strategy.validate({ sub: 'user-uuid' } as never);

    expect(result.email).toBe('');
  });
});
