import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { pageDef } from '../page-registry';
import { CmsAuditService } from './cms-audit.service';
import { CmsPageCoreService } from './cms-page-core.service';

@Injectable()
export class CmsDraftService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pageCore: CmsPageCoreService,
    private readonly audit: CmsAuditService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Validate + save the working draft. Never affects the live site. */
  async saveDraft(key: string, body: { title?: string; content: unknown }, actorId?: string | null) {
    const def = pageDef(key);
    if (!def) throw new NotFoundException(`Unknown CMS page: ${key}`);
    const parsed = this.pageCore.contentSchemaFor(def).safeParse(body.content);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid page content',
        details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    const page = await this.pageCore.ensurePage(key, actorId);
    const latest = await this.pageCore.latestVersion(page.id);
    const content = parsed.data as unknown as Prisma.InputJsonValue;

    let working;
    if (!latest || latest.status === ContentStatus.PUBLISHED) {
      // The newest version is live — start a fresh draft on top so we never
      // mutate a published snapshot.
      working = await this.prisma.contentVersion.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          pageId: page.id,
          version: (latest?.version ?? 0) + 1,
          content,
          status: ContentStatus.DRAFT,
          createdBy: actorId ?? null,
        },
      });
    } else {
      working = await this.prisma.contentVersion.update({
        where: { id: latest.id },
        data: { content, createdBy: actorId ?? null },
      });
    }

    await this.prisma.page.update({
      where: { id: page.id },
      data: { updatedBy: actorId ?? null, ...(body.title ? { title: body.title } : {}) },
    });
    await this.audit.write({ action: 'UPDATE', entity: 'Page', entityId: page.id, actorId, after: { version: working.version } });

    return { versionId: working.id, version: working.version, status: working.status };
  }
}
