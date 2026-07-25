import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { EMPTY_CONTENT, PageContent } from '../schemas/blocks.schema';
import { PAGE_REGISTRY, cacheTagFor, pageDef, type PageDef } from '../page-registry';
import { contentType } from '../content-types';
import { CmsAuditService } from './cms-audit.service';

/**
 * Shared page resolution helpers: known-page validation, content schema/default
 * lookup, and lazy Page+draft creation. Every other CMS page service builds on this.
 */
@Injectable()
export class CmsPageCoreService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: CmsAuditService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  assertKnownKey(key: string) {
    if (!pageDef(key)) throw new NotFoundException(`Unknown CMS page: ${key}`);
  }

  /** The Zod schema a page's content is validated against (structured or blocks). */
  contentSchemaFor(def: PageDef) {
    if (def.editor === 'structured') {
      const ct = contentType(def.contentType);
      if (ct) return ct.schema;
    }
    return PageContent;
  }

  /** The content a page is seeded with on first access (real content, not empty). */
  private defaultContentFor(def: PageDef): unknown {
    if (def.editor === 'structured') {
      const ct = contentType(def.contentType);
      if (ct) return ct.default;
    }
    return EMPTY_CONTENT;
  }

  /** Lazily create a Page + its first empty draft version on first access. */
  async ensurePage(key: string, actorId?: string | null) {
    this.assertKnownKey(key);
    const existing = await this.prisma.page.findUnique({
      where: { tenantId_key: { tenantId: this.tenantId, key } },
    });
    if (existing) return existing;

    const def = pageDef(key)!;
    const pageId = randomUUID();
    const page = await this.prisma.page.create({
      data: {
        id: pageId,
        tenantId: this.tenantId,
        key,
        title: def.title,
        cacheTag: cacheTagFor(key),
        featureFlag: def.featureFlag ?? null,
        status: ContentStatus.DRAFT,
        updatedBy: actorId ?? null,
        Versions: {
          create: {
            id: randomUUID(),
            tenantId: this.tenantId,
            version: 1,
            content: this.defaultContentFor(def) as Prisma.InputJsonValue,
            status: ContentStatus.DRAFT,
            createdBy: actorId ?? null,
          },
        },
      },
    });
    await this.audit.write({ action: 'CREATE', entity: 'Page', entityId: page.id, actorId, after: { key, title: def.title } });
    return page;
  }

  async latestVersion(pageId: string) {
    return this.prisma.contentVersion.findFirst({
      where: { pageId, tenantId: this.tenantId },
      orderBy: { version: 'desc' },
    });
  }

  /** Sidebar list: every registry page merged with its DB status. */
  async listPages() {
    const rows = await this.prisma.page.findMany({
      where: { tenantId: this.tenantId },
      select: { key: true, status: true, publishedVersionId: true, updatedAt: true },
    });
    const byKey = new Map(rows.map((r) => [r.key, r]));
    return PAGE_REGISTRY.map((def) => {
      const row = byKey.get(def.key);
      return {
        ...def,
        status: row?.status ?? ('DRAFT' as ContentStatus),
        published: Boolean(row?.publishedVersionId),
        updatedAt: row?.updatedAt ?? null,
      };
    });
  }

  /** Editor view: page metadata + the current working draft content. */
  async getEditorPage(key: string, actorId?: string | null) {
    const page = await this.ensurePage(key, actorId);
    const working = await this.latestVersion(page.id);
    const def = pageDef(key)!;
    return {
      def,
      page: {
        id: page.id,
        key: page.key,
        title: page.title,
        status: page.status,
        published: Boolean(page.publishedVersionId),
        publishedVersionId: page.publishedVersionId,
        updatedAt: page.updatedAt,
      },
      working: working
        ? {
            versionId: working.id,
            version: working.version,
            status: working.status,
            content: working.content,
          }
        : { versionId: null, version: 0, status: 'DRAFT', content: EMPTY_CONTENT },
    };
  }
}
