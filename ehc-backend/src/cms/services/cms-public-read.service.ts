import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { pageDef } from '../page-registry';

@Injectable()
export class CmsPublicReadService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** What the public site reads. Selects ONLY the published version — never drafts. */
  async getPublishedPage(key: string) {
    const def = pageDef(key);
    if (!def) throw new NotFoundException(`Unknown CMS page: ${key}`);
    const page = await this.prisma.page.findUnique({
      where: { tenantId_key: { tenantId: this.tenantId, key } },
      select: { title: true, publishedVersionId: true, PublishedVersion: { select: { content: true, version: true, publishedAt: true } } },
    });
    if (!page?.publishedVersionId || !page.PublishedVersion) {
      return { key, route: def.route, published: false, content: null };
    }
    return {
      key,
      route: def.route,
      title: page.title,
      published: true,
      version: page.PublishedVersion.version,
      publishedAt: page.PublishedVersion.publishedAt,
      content: page.PublishedVersion.content,
    };
  }
}
