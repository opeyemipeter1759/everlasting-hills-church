import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { pageDef } from '../page-registry';
import { CmsAuditService } from './cms-audit.service';
import { CmsRevalidateService } from './cms-revalidate.service';
import { CmsPageCoreService } from './cms-page-core.service';

@Injectable()
export class CmsPublishService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pageCore: CmsPageCoreService,
    private readonly audit: CmsAuditService,
    private readonly revalidate: CmsRevalidateService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Promote the working draft to live. Returns the cache tag to revalidate. */
  async publish(key: string, actorId?: string | null) {
    const page = await this.pageCore.ensurePage(key, actorId);
    const working = await this.pageCore.latestVersion(page.id);
    if (!working) throw new BadRequestException('Nothing to publish');

    if (working.status !== ContentStatus.PUBLISHED) {
      await this.prisma.contentVersion.update({
        where: { id: working.id },
        data: { status: ContentStatus.PUBLISHED, publishedAt: new Date(), publishedBy: actorId ?? null },
      });
    }
    await this.prisma.page.update({
      where: { id: page.id },
      data: { publishedVersionId: working.id, status: ContentStatus.PUBLISHED, updatedBy: actorId ?? null },
    });
    await this.audit.write({
      action: 'PUBLISH',
      entity: 'Page',
      entityId: page.id,
      actorId,
      before: { publishedVersionId: page.publishedVersionId },
      after: { publishedVersionId: working.id, version: working.version },
    });

    const def = pageDef(key)!;
    this.revalidate.trigger([page.cacheTag], [def.route]);
    return { key, route: def.route, cacheTag: page.cacheTag, version: working.version };
  }

  /** Take the page offline — the public read path returns "not published". */
  async unpublish(key: string, actorId?: string | null) {
    const page = await this.pageCore.ensurePage(key, actorId);
    await this.prisma.page.update({
      where: { id: page.id },
      data: { publishedVersionId: null, status: ContentStatus.DRAFT, updatedBy: actorId ?? null },
    });
    await this.audit.write({ action: 'UNPUBLISH', entity: 'Page', entityId: page.id, actorId, before: { publishedVersionId: page.publishedVersionId } });
    const def = pageDef(key)!;
    this.revalidate.trigger([page.cacheTag], [def.route]);
    return { key, route: def.route, cacheTag: page.cacheTag };
  }

  /** Restore a prior version: copy its content into a new version and publish it. */
  async rollback(key: string, version: number, actorId?: string | null) {
    const page = await this.pageCore.ensurePage(key, actorId);
    const target = await this.prisma.contentVersion.findUnique({
      where: { pageId_version: { pageId: page.id, version } },
    });
    if (!target) throw new NotFoundException('Version not found');
    const latest = await this.pageCore.latestVersion(page.id);

    const restored = await this.prisma.contentVersion.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        pageId: page.id,
        version: (latest?.version ?? 0) + 1,
        content: target.content as unknown as Prisma.InputJsonValue,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedBy: actorId ?? null,
        createdBy: actorId ?? null,
      },
    });
    await this.prisma.page.update({
      where: { id: page.id },
      data: { publishedVersionId: restored.id, status: ContentStatus.PUBLISHED, updatedBy: actorId ?? null },
    });
    await this.audit.write({ action: 'ROLLBACK', entity: 'Page', entityId: page.id, actorId, before: { fromVersion: version }, after: { newVersion: restored.version } });
    const def = pageDef(key)!;
    this.revalidate.trigger([page.cacheTag], [def.route]);
    return { key, route: def.route, cacheTag: page.cacheTag, version: restored.version };
  }
}
