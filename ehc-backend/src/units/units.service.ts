import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit lookups specific to the *current* user.
 * Generic unit-wide analytics live in AnalyticsService (/admin/units, /admin/units/:id/...).
 */
@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find the unit the given user (Supabase user id) leads. Resolves via
   * Profile → Member → UnitMember(isLead=true) → Unit, so a name change never breaks the link.
   * Returns null if the user leads no unit.
   */
  async findUnitLedBy(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { Member: { select: { id: true } } },
    });
    if (!profile?.Member) return null;

    const lead = await this.prisma.unitMember.findFirst({
      where: { memberId: profile.Member.id, isLead: true },
      include: {
        Unit: {
          include: {
            _count: { select: { UnitMember: true } },
          },
        },
      },
    });
    if (!lead) return null;

    return {
      id: lead.Unit.id,
      name: lead.Unit.name,
      description: lead.Unit.description,
      totalMembers: lead.Unit._count.UnitMember,
      isLead: true,
    };
  }
}
