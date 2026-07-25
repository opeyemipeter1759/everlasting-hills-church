import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UnitsSelfService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyUnit(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { Member: { select: { id: true } } },
    });
    if (!profile?.Member) return null;

    const membership = await this.prisma.unitMember.findFirst({
      where: {
        memberId: profile.Member.id,
        OR: [{ isLead: true }, { isAssistant: true }],
      },
      include: {
        Unit: { include: { _count: { select: { UnitMember: true } } } },
      },
    });
    if (!membership) return null;

    return {
      id: membership.Unit.id,
      name: membership.Unit.name,
      description: membership.Unit.description,
      totalMembers: membership.Unit._count.UnitMember,
      isLead: membership.isLead,
      isAssistant: membership.isAssistant,
    };
  }
}
