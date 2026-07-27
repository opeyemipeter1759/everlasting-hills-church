import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SermonStatus, SermonType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { SERMON_COUNTS_INCLUDE, SERMON_EPISODES_INCLUDE, serializeSermon } from '../sermon-serialization.util';

@Injectable()
export class SermonAdminActionsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Tenant-scoped delete. Returns count so the controller can throw 404 when the id wasn't
   * in this tenant — defends against cross-tenant deletion if an attacker knows another
   * tenant's sermon UUID.
   */
  async deleteSermon(id: string) {
    const result = await this.prisma.sermon.deleteMany({ where: { id, tenantId: this.tenantId } });
    if (result.count === 0) {
      throw new NotFoundException('Sermon not found');
    }
    return { id, deleted: true };
  }

  /**
   * Tenant-scoped featured update. First confirms the target sermon belongs to this tenant
   * BEFORE clearing other featured flags — otherwise an attacker could wipe a victim
   * tenant's featured flag by knowing nothing more than any of their sermon ids.
   */
  async setFeaturedSermon(id: string) {
    const target = await this.prisma.sermon.findFirst({
      where: { id, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('Sermon not found');
    }
    await this.prisma.sermon.updateMany({
      where: { tenantId: this.tenantId, isFeatured: true },
      data: { isFeatured: false },
    });
    const sermon = await this.prisma.sermon.update({
      where: { id },
      data: { isFeatured: true, updatedAt: new Date() },
      include: {
        ...SERMON_EPISODES_INCLUDE,
        ...SERMON_COUNTS_INCLUDE,
      },
    });
    return serializeSermon(sermon);
  }

  async getAdminSermonOverview() {
    const [totalSermons, totalSeries, totalSingle, totalDrafted, totalPublished] = await this.prisma.$transaction([
      this.prisma.sermon.count({ where: { tenantId: this.tenantId } }),
      this.prisma.sermon.count({ where: { tenantId: this.tenantId, type: SermonType.SERIES } }),
      this.prisma.sermon.count({ where: { tenantId: this.tenantId, type: SermonType.SINGLE } }),
      this.prisma.sermon.count({ where: { tenantId: this.tenantId, status: SermonStatus.DRAFT } }),
      this.prisma.sermon.count({ where: { tenantId: this.tenantId, status: SermonStatus.PUBLISHED } }),
    ]);

    return { totalSermons, totalSeries, totalSingle, totalDrafted, totalPublished };
  }
}
