import { UnitsService } from './units.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('UnitsService.findUnitLedBy', () => {
  function makeService(profileResult: unknown, unitMemberResult: unknown) {
    const prisma = {
      profile: { findUnique: jest.fn().mockResolvedValue(profileResult) },
      unitMember: { findFirst: jest.fn().mockResolvedValue(unitMemberResult) },
    } as unknown as PrismaService;
    return { service: new UnitsService(prisma), prisma };
  }

  it('returns null when the user has no Profile', async () => {
    const { service } = makeService(null, null);
    expect(await service.findUnitLedBy('orphan-user')).toBeNull();
  });

  it('returns null when the Profile has no linked Member', async () => {
    const { service } = makeService({ Member: null }, null);
    expect(await service.findUnitLedBy('user')).toBeNull();
  });

  it('returns null when the Member is not a unit lead anywhere', async () => {
    const { service } = makeService({ Member: { id: 'm1' } }, null);
    expect(await service.findUnitLedBy('user')).toBeNull();
  });

  it('returns the unit with totalMembers when the user leads one', async () => {
    const { service, prisma } = makeService(
      { Member: { id: 'member-1' } },
      {
        Unit: {
          id: 'unit-1',
          name: 'Hospitality',
          description: 'Welcome team',
          _count: { UnitMember: 25 },
        },
      },
    );

    const result = await service.findUnitLedBy('user');

    expect(result).toEqual({
      id: 'unit-1',
      name: 'Hospitality',
      description: 'Welcome team',
      totalMembers: 25,
      isLead: true,
    });
    // Verifies the lookup filter is correct: by memberId + isLead=true
    expect(prisma.unitMember.findFirst).toHaveBeenCalledWith({
      where: { memberId: 'member-1', isLead: true },
      include: expect.any(Object),
    });
  });
});
