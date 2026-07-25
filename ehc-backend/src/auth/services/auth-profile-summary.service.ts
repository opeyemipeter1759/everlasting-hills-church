import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EffectiveRolesService } from '../effective-roles.service';
import type { UserProfileSummary } from '../auth.types';

@Injectable()
export class AuthProfileSummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
  ) {}

  async getProfileSummary(userId: string): Promise<UserProfileSummary> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        Member: { select: { firstName: true, lastName: true, photoUrl: true, status: true } },
      },
    });
    // Role is the highest effective role (grants + assignments), not the legacy column.
    const eff = await this.effectiveRoles.getEffectiveRoles(profile?.id ?? null);
    return {
      role: profile ? eff.primaryRole : null,
      firstName: profile?.Member?.firstName ?? null,
      lastName: profile?.Member?.lastName ?? null,
      photoUrl: profile?.Member?.photoUrl ?? null,
      memberStatus: profile?.Member?.status ?? null,
    };
  }
}
