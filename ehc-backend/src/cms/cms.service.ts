import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentStatus, Prisma } from '@prisma/client';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { UploadsService } from '../uploads/uploads.service';
import { EMPTY_CONTENT, PageContent } from './schemas/blocks.schema';
import { DEFAULT_SITE_IDENTITY, SiteIdentitySchema } from './schemas/site-config.schema';
import { PAGE_REGISTRY, cacheTagFor, pageDef, type PageDef } from './page-registry';
import { contentType } from './content-types';

type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'PUBLISH'
  | 'UNPUBLISH'
  | 'DELETE'
  | 'ROLLBACK';

/**
 * CMS content service.
 *
 * Enforcement: every query is scoped to the tenant (config DEFAULT_TENANT_ID);
 * the controller gates writes to SUPER_ADMIN / PASTOR via @Roles. Draft edits
 * never touch the live site — the public read path selects only the row pointed
 * at by Page.publishedVersionId. History is append-only in ContentVersion.
 */
@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);
  private readonly tenantId: string;
  private readonly previewSecret: string;
  private readonly r2PublicUrl: string;
  private readonly appUrl: string;
  private readonly revalidateSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    // Read infra secrets from process.env directly (same pattern as UploadsService),
    // so the CMS doesn't require additions to the typed Env schema.
    this.previewSecret =
      process.env.CMS_PREVIEW_SECRET ??
      process.env.SUPABASE_JWT_SECRET ??
      'ehc-cms-preview-secret';
    this.r2PublicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
    this.appUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    this.revalidateSecret =
      process.env.CMS_REVALIDATE_SECRET ??
      process.env.SUPABASE_JWT_SECRET ??
      'ehc-cms-revalidate';
  }

  /**
   * Ask the Next.js site to revalidate ISR cache tags / paths after a publish.
   * Fire-and-forget server-to-server call; failures are logged, never thrown into
   * the publish path (the DB is already the source of truth).
   */
  private triggerRevalidate(tags: string[] = [], paths: string[] = []) {
    void fetch(`${this.appUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': this.revalidateSecret,
      },
      body: JSON.stringify({ tags, paths }),
    }).catch((err) =>
      this.logger.warn(`ISR revalidate call failed: ${(err as Error).message}`),
    );
  }

  // ── Pages ────────────────────────────────────────────────────────────────────

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

  private assertKnownKey(key: string) {
    if (!pageDef(key)) throw new NotFoundException(`Unknown CMS page: ${key}`);
  }

  /** The Zod schema a page's content is validated against (structured or blocks). */
  private contentSchemaFor(def: PageDef) {
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
  private async ensurePage(key: string, actorId?: string | null) {
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
    await this.writeAudit({ action: 'CREATE', entity: 'Page', entityId: page.id, actorId, after: { key, title: def.title } });
    return page;
  }

  private async latestVersion(pageId: string) {
    return this.prisma.contentVersion.findFirst({
      where: { pageId, tenantId: this.tenantId },
      orderBy: { version: 'desc' },
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

  /** Validate + save the working draft. Never affects the live site. */
  async saveDraft(
    key: string,
    body: { title?: string; content: unknown },
    actorId?: string | null,
  ) {
    const def = pageDef(key);
    if (!def) throw new NotFoundException(`Unknown CMS page: ${key}`);
    const parsed = this.contentSchemaFor(def).safeParse(body.content);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid page content',
        details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    const page = await this.ensurePage(key, actorId);
    const latest = await this.latestVersion(page.id);
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
    await this.writeAudit({ action: 'UPDATE', entity: 'Page', entityId: page.id, actorId, after: { version: working.version } });

    return { versionId: working.id, version: working.version, status: working.status };
  }

  /** Promote the working draft to live. Returns the cache tag to revalidate. */
  async publish(key: string, actorId?: string | null) {
    const page = await this.ensurePage(key, actorId);
    const working = await this.latestVersion(page.id);
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
    await this.writeAudit({
      action: 'PUBLISH',
      entity: 'Page',
      entityId: page.id,
      actorId,
      before: { publishedVersionId: page.publishedVersionId },
      after: { publishedVersionId: working.id, version: working.version },
    });

    const def = pageDef(key)!;
    this.triggerRevalidate([page.cacheTag], [def.route]);
    return { key, route: def.route, cacheTag: page.cacheTag, version: working.version };
  }

  /** Take the page offline — the public read path returns "not published". */
  async unpublish(key: string, actorId?: string | null) {
    const page = await this.ensurePage(key, actorId);
    await this.prisma.page.update({
      where: { id: page.id },
      data: { publishedVersionId: null, status: ContentStatus.DRAFT, updatedBy: actorId ?? null },
    });
    await this.writeAudit({ action: 'UNPUBLISH', entity: 'Page', entityId: page.id, actorId, before: { publishedVersionId: page.publishedVersionId } });
    const def = pageDef(key)!;
    this.triggerRevalidate([page.cacheTag], [def.route]);
    return { key, route: def.route, cacheTag: page.cacheTag };
  }

  // ── Version history ──────────────────────────────────────────────────────────

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

  /** Restore a prior version: copy its content into a new version and publish it. */
  async rollback(key: string, version: number, actorId?: string | null) {
    const page = await this.ensurePage(key, actorId);
    const target = await this.prisma.contentVersion.findUnique({
      where: { pageId_version: { pageId: page.id, version } },
    });
    if (!target) throw new NotFoundException('Version not found');
    const latest = await this.latestVersion(page.id);

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
    await this.writeAudit({ action: 'ROLLBACK', entity: 'Page', entityId: page.id, actorId, before: { fromVersion: version }, after: { newVersion: restored.version } });
    const def = pageDef(key)!;
    this.triggerRevalidate([page.cacheTag], [def.route]);
    return { key, route: def.route, cacheTag: page.cacheTag, version: restored.version };
  }

  // ── Public read (no auth) ─────────────────────────────────────────────────────

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

  // ── Site-wide settings (singleton form; no draft/publish) ──────────────────────

  /** Public read: the current site identity, or the seeded default. */
  async getSiteConfig() {
    const row = await this.prisma.siteConfig.findUnique({ where: { tenantId: this.tenantId } });
    const content = row?.content ?? DEFAULT_SITE_IDENTITY;
    // Coerce through the schema so consumers always get a complete shape.
    const parsed = SiteIdentitySchema.safeParse(content);
    return { content: parsed.success ? parsed.data : DEFAULT_SITE_IDENTITY, updatedAt: row?.updatedAt ?? null };
  }

  /** Validate + upsert the site identity. Live (no draft), audited. */
  async updateSiteConfig(raw: unknown, actorId?: string | null) {
    const parsed = SiteIdentitySchema.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid site settings',
        details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    const before = await this.prisma.siteConfig.findUnique({ where: { tenantId: this.tenantId }, select: { id: true } });
    const content = parsed.data as unknown as Prisma.InputJsonValue;
    const row = await this.prisma.siteConfig.upsert({
      where: { tenantId: this.tenantId },
      create: { id: randomUUID(), tenantId: this.tenantId, content, updatedBy: actorId ?? null },
      update: { content, updatedBy: actorId ?? null },
    });
    await this.writeAudit({ action: 'UPDATE', entity: 'SiteConfig', entityId: row.id, actorId });
    // Site settings appear in the footer on every page — revalidate the tag.
    this.triggerRevalidate(['cms:site-config']);
    return { content: parsed.data, updatedAt: row.updatedAt };
  }

  // ── Preview (signed, 1h TTL) ───────────────────────────────────────────────────

  createPreviewToken(key: string) {
    this.assertKnownKey(key);
    const exp = Date.now() + 60 * 60 * 1000;
    const payload = `${key}.${exp}`;
    const sig = createHmac('sha256', this.previewSecret).update(payload).digest('base64url');
    const token = Buffer.from(`${payload}.${sig}`).toString('base64url');
    return { token, expiresAt: new Date(exp).toISOString() };
  }

  async resolvePreview(token: string) {
    let key: string;
    let exp: number;
    let sig: string;
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split('.');
      sig = parts.pop() as string;
      exp = Number(parts.pop());
      key = parts.join('.');
    } catch {
      throw new BadRequestException('Invalid preview token');
    }
    const expected = createHmac('sha256', this.previewSecret).update(`${key}.${exp}`).digest('base64url');
    const a = Buffer.from(sig ?? '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('Invalid preview token');
    }
    if (!Number.isFinite(exp) || Date.now() > exp) {
      throw new BadRequestException('Preview link expired');
    }
    const editor = await this.getEditorPage(key);
    const def = pageDef(key)!;
    return { key, route: def.route, title: editor.page.title, preview: true, content: editor.working.content };
  }

  // ── Media library ──────────────────────────────────────────────────────────────

  private mediaUrl(r2Key: string) {
    return this.r2PublicUrl ? `${this.r2PublicUrl}/${r2Key}` : r2Key;
  }

  async listMedia() {
    const rows = await this.prisma.mediaAsset.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((m) => ({
      id: m.id,
      url: this.mediaUrl(m.r2Key),
      alt: m.alt,
      mimeType: m.mimeType,
      sizeBytes: m.sizeBytes,
      width: m.width,
      height: m.height,
      createdAt: m.createdAt,
    }));
  }

  async uploadMedia(
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    meta: { alt: string; width?: number; height?: number },
    actorId?: string | null,
  ) {
    if (!meta.alt?.trim()) throw new BadRequestException('Alt text is required');
    const { key } = await this.uploads.uploadObject(file, `cms/${this.tenantId}`);
    const asset = await this.prisma.mediaAsset.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        r2Key: key,
        alt: meta.alt.trim(),
        mimeType: file.mimetype,
        sizeBytes: file.size,
        width: meta.width ?? null,
        height: meta.height ?? null,
        uploadedBy: actorId ?? null,
      },
    });
    await this.writeAudit({ action: 'CREATE', entity: 'MediaAsset', entityId: asset.id, actorId, after: { r2Key: key, alt: asset.alt } });
    return { id: asset.id, url: this.mediaUrl(asset.r2Key), alt: asset.alt, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes, width: asset.width, height: asset.height, createdAt: asset.createdAt };
  }

  async deleteMedia(id: string, actorId?: string | null) {
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!asset) throw new NotFoundException('Media not found');
    await this.prisma.mediaAsset.delete({ where: { id } });
    await this.writeAudit({ action: 'DELETE', entity: 'MediaAsset', entityId: id, actorId, before: { r2Key: asset.r2Key } });
    return { success: true, id };
  }

  // ── Audit ────────────────────────────────────────────────────────────────────

  private async writeAudit(entry: {
    action: AuditAction;
    entity: string;
    entityId?: string | null;
    actorId?: string | null;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          actorId: entry.actorId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          before: entry.before ?? Prisma.DbNull,
          after: entry.after ?? Prisma.DbNull,
        },
      });
    } catch (err) {
      // Audit must never break the mutation it records.
      this.logger.error(`Audit write failed (${entry.action} ${entry.entity}): ${(err as Error).message}`);
    }
  }

  async listAudit(limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, limit)),
    });
  }
}
