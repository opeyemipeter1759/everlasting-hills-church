import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

@Injectable()
export class CmsVersionsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async listVersions(key: string) {
    const page = await this.prisma.page.findUnique({
      where: { tenantId_key: { tenantId: this.tenantId, key } },
      select: { id: true, publishedVersionId: true },
    });
    if (!page) return { versions: [] };
    const versions = await this.prisma.contentVersion.findMany({
      where: { pageId: page.id, tenantId: this.tenantId },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, status: true, publishedAt: true, publishedBy: true, createdAt: true, createdBy: true },
    });
    return {
      publishedVersionId: page.publishedVersionId,
      versions: versions.map((v) => ({ ...v, isLive: v.id === page.publishedVersionId })),
    };
  }

  async getVersion(key: string, version: number) {
    const page = await this.prisma.page.findUnique({
      where: { tenantId_key: { tenantId: this.tenantId, key } },
      select: { id: true },
    });
    if (!page) throw new NotFoundException('Page not found');
    const v = await this.prisma.contentVersion.findUnique({
      where: { pageId_version: { pageId: page.id, version } },
    });
    if (!v) throw new NotFoundException('Version not found');
    return { version: v.version, status: v.status, content: v.content, publishedAt: v.publishedAt };
  }
}
