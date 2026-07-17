import { UnitsService } from './units.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ConfigService } from '@nestjs/config';

describe('UnitsService.findMyUnit', () => {
  function makeService(profileResult: unknown, unitMemberResult: unknown) {
    const prisma = {
      profile: { findUnique: jest.fn().mockResolvedValue(profileResult) },
      unitMember: { findFirst: jest.fn().mockResolvedValue(unitMemberResult) },
    } as unknown as PrismaService;
    const effectiveRoles = {
      getEffectiveRoles: jest.fn(),
      getEffectiveRolesBatch: jest.fn(),
    };
    // Stub ConfigService — UnitsService only reads DEFAULT_TENANT_ID at construction
    const config = {
      get: jest.fn().mockReturnValue('test-tenant'),
    } as unknown as ConfigService<Record<string, unknown>, true>;
    return { service: new UnitsService(prisma, effectiveRoles as never, config), prisma };
  }

  it('returns null when the user has no Profile', async () => {
    const { service } = makeService(null, null);
    expect(await service.findMyUnit('orphan-user')).toBeNull();
  });

  it('returns null when the Profile has no linked Member', async () => {
    const { service } = makeService({ Member: null }, null);
    expect(await service.findMyUnit('user')).toBeNull();
  });

  it('returns null when the Member is not a lead or assistant anywhere', async () => {
    const { service } = makeService({ Member: { id: 'm1' } }, null);
    expect(await service.findMyUnit('user')).toBeNull();
  });

  it('returns the unit with totalMembers when the user leads one', async () => {
    const { service, prisma } = makeService(
      { Member: { id: 'member-1' } },
      {
        isLead: true,
        isAssistant: false,
        Unit: {
          id: 'unit-1',
          name: 'Hospitality',
          description: 'Welcome team',
          _count: { UnitMember: 25 },
        },
      },
    );

    const result = await service.findMyUnit('user');

    expect(result).toEqual({
      id: 'unit-1',
      name: 'Hospitality',
      description: 'Welcome team',
      totalMembers: 25,
      isLead: true,
      isAssistant: false,
    });
    expect(prisma.unitMember.findFirst).toHaveBeenCalledWith({
      where: { memberId: 'member-1', OR: [{ isLead: true }, { isAssistant: true }] },
      include: expect.any(Object),
    });
  });
});
