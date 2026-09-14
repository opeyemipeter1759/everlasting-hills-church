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

  /**
   * Who is "the leader" of a unit for attribution (e.g. `addedById` on
   * auto-surfaced entries): its active unit lead, else the head of the
   * department it sits in. The fallback matters for Follow-Up specifically —
   * its department head is expected to run the pipeline exactly as a unit
   * lead would, so a missing lead must not stall the daily sweeps.
   */
  async getUnitLeaderProfileId(unitId: string, cache: Map<string, string | null>): Promise<string | null> {
    if (cache.has(unitId)) return cache.get(unitId)!;
    const [lead, heads] = await Promise.all([
      this.prisma.unitLeadAssignment.findFirst({
        where: { tenantId: this.tenantId, unitId, endedAt: null },
        select: { userId: true },
      }),
      this.getDepartmentHeadProfileIds(unitId),
    ]);
    const profileId = lead?.userId ?? heads[0] ?? null;
    cache.set(unitId, profileId);
    return profileId;
  }

  /** Everyone who leads a unit — its unit lead plus the head(s) of its
   * department — for notifications that a leader is expected to act on. */
  async getUnitLeadershipProfileIds(unitId: string, cache: Map<string, string[]>): Promise<string[]> {
    if (cache.has(unitId)) return cache.get(unitId)!;
    const [leads, heads] = await Promise.all([
      this.prisma.unitLeadAssignment.findMany({
        where: { tenantId: this.tenantId, unitId, endedAt: null },
        select: { userId: true },
      }),
      this.getDepartmentHeadProfileIds(unitId),
    ]);
    const ids = [...new Set([...leads.map((l) => l.userId), ...heads])];
    cache.set(unitId, ids);
    return ids;
  }

  private async getDepartmentHeadProfileIds(unitId: string): Promise<string[]> {
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, tenantId: this.tenantId },
      select: { departmentId: true },
    });
    if (!unit?.departmentId) return [];
    const [heads, hods] = await Promise.all([
      this.prisma.departmentHead.findMany({
        where: { tenantId: this.tenantId, departmentId: unit.departmentId, endedAt: null },
        select: { userId: true },
      }),
      this.prisma.departmentHod.findMany({
        where: { tenantId: this.tenantId, departmentId: unit.departmentId, endedAt: null },
        select: { userId: true },
      }),
    ]);
    return [...new Set([...heads.map((h) => h.userId), ...hods.map((h) => h.userId)])];
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
