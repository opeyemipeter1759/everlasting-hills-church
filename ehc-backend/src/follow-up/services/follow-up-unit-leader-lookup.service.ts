import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

@Injectable()
export class FollowUpUnitLeaderLookupService {
  private readonly logger = new Logger(FollowUpUnitLeaderLookupService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getUnitLeaderProfileId(unitId: string, cache: Map<string, string | null>): Promise<string | null> {
    if (cache.has(unitId)) return cache.get(unitId)!;
    const lead = await this.prisma.unitLeadAssignment.findFirst({
      where: { tenantId: this.tenantId, unitId, endedAt: null },
      select: { userId: true },
    });
    const profileId = lead?.userId ?? null;
    cache.set(unitId, profileId);
    return profileId;
  }

  async getFollowUpUnitId(): Promise<string | null> {
    const unit = await this.prisma.unit.findFirst({
      where: { tenantId: this.tenantId, name: 'Follow-Up' },
      select: { id: true },
    });
    if (!unit) this.logger.warn('auto-surface: no unit named "Follow-Up" found — no fallback available');
    return unit?.id ?? null;
  }
}
