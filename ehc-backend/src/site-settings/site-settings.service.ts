import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SiteSection as PrismaSiteSection } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import {
  SECTION_SCHEMAS,
  SITE_SECTIONS,
  SiteSection,
  type SiteSectionName,
} from './schemas/site-settings.schemas';
import { DEFAULT_CONTENT } from './schemas/default-content';
import { ensureDefaultTenant } from '../tenant/ensure-default-tenant';

export interface SiteSettingsRow {
  section: SiteSectionName;
  content: unknown;
  updatedAt: Date;
  updatedBy: string | null;
}

/**
 * Site settings: one Prisma row per homepage section, content is a Zod-validated
 * JSON blob.
 *
 * Caching: every GET response is memoized in-process for `CACHE_TTL_MS`. The cache
 * is invalidated immediately on PUT so admins see their edit reflected next request.
 * This keeps the public homepage cheap — one DB query, then memoized — without
 * giving up freshness in the admin flow.
 *
 * Seeding: on module init, any missing section row is inserted with the default
 * content from `default-content.ts`. This means a fresh database boots into a
 * pixel-identical homepage on first request, and adding a new section later only
 * requires a new entry in DEFAULT_CONTENT (no migration).
 */
@Injectable()
export class SiteSettingsService implements OnModuleInit {
  private readonly logger = new Logger(SiteSettingsService.name);
  private readonly tenantId: string;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  /** section → { value, expiresAt }. One slot per section. */
  private cache = new Map<SiteSectionName, { value: SiteSettingsRow; expiresAt: number }>();

  private readonly appUrl: string;
  private readonly revalidateSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    this.revalidateSecret =
      process.env.CMS_REVALIDATE_SECRET ??
      process.env.SUPABASE_JWT_SECRET ??
      'ehc-cms-revalidate';
  }

  /**
   * Publish a homepage edit to the live site immediately by revalidating the
   * "site-settings" ISR tag (the homepage reads that tag). Fire-and-forget.
   */
  private triggerRevalidate() {
    void fetch(`${this.appUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': this.revalidateSecret,
      },
      body: JSON.stringify({ tags: ['site-settings'], paths: ['/'] }),
    }).catch((err) =>
      this.logger.warn(`ISR revalidate call failed: ${(err as Error).message}`),
    );
  }

  async onModuleInit() {
    await this.seedMissing();
  }

  /** Seed any section that doesn't yet have a row. Idempotent. */
  private async seedMissing() {
    await ensureDefaultTenant(this.prisma, this.tenantId);

    const existing = await this.prisma.siteSettings.findMany({
      where: { tenantId: this.tenantId },
      select: { section: true },
    });
    const have = new Set(existing.map((r) => r.section as SiteSectionName));

    const toInsert: { section: SiteSectionName; content: unknown }[] = [];
    for (const section of SITE_SECTIONS) {
      if (!have.has(section)) {
        toInsert.push({ section, content: DEFAULT_CONTENT[section] });
      }
    }
    if (toInsert.length === 0) return;

    await this.prisma.$transaction(
      toInsert.map((entry) =>
        this.prisma.siteSettings.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            section: entry.section as PrismaSiteSection,
            content: entry.content as never, // typed via Zod on read
          },
        }),
      ),
    );
    this.logger.log(
      `Seeded ${toInsert.length} default site_settings row(s): ${toInsert
        .map((r) => r.section)
        .join(', ')}`,
    );
  }

  /** Return every section as a single map. Used by the homepage one-shot fetch. */
  async findAll(): Promise<Record<SiteSectionName, SiteSettingsRow>> {
    const rows = await this.prisma.siteSettings.findMany({
      where: { tenantId: this.tenantId },
      select: {
        section: true,
        content: true,
        updatedAt: true,
        updatedBy: true,
      },
    });
    const out = {} as Record<SiteSectionName, SiteSettingsRow>;
    for (const r of rows) {
      const section = r.section as SiteSectionName;
      const row: SiteSettingsRow = {
        section,
        content: r.content,
        updatedAt: r.updatedAt,
        updatedBy: r.updatedBy,
      };
      out[section] = row;
      this.cache.set(section, { value: row, expiresAt: Date.now() + this.CACHE_TTL_MS });
    }
    // Backfill any cached defaults for sections that somehow have no row yet
    // (e.g. brand-new section added between deploys — should be rare given seed).
    for (const section of SITE_SECTIONS) {
      if (!out[section]) {
        out[section] = {
          section,
          content: DEFAULT_CONTENT[section],
          updatedAt: new Date(0),
          updatedBy: null,
        };
      }
    }
    return out;
  }

  /** Return one section, hot off the cache if fresh. */
  async findOne(rawSection: string): Promise<SiteSettingsRow> {
    const section = this.parseSection(rawSection);
    const cached = this.cache.get(section);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    const row = await this.prisma.siteSettings.findUnique({
      where: { tenantId_section: { tenantId: this.tenantId, section: section as PrismaSiteSection } },
      select: {
        section: true,
        content: true,
        updatedAt: true,
        updatedBy: true,
      },
    });
    if (!row) {
      // Defensive: if the seed didn't run for any reason, fall back to defaults
      // so the homepage never breaks.
      this.logger.warn(`No site_settings row for ${section}; serving default.`);
      return {
        section,
        content: DEFAULT_CONTENT[section],
        updatedAt: new Date(0),
        updatedBy: null,
      };
    }
    const value: SiteSettingsRow = {
      section,
      content: row.content,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
    };
    this.cache.set(section, { value, expiresAt: Date.now() + this.CACHE_TTL_MS });
    return value;
  }

  /**
   * Validate + upsert one section's content. Throws 400 on schema mismatch with
   * the full Zod issue list so the admin UI can render field-level errors.
   */
  async update(
    rawSection: string,
    rawContent: unknown,
    actorId: string | null,
  ): Promise<SiteSettingsRow> {
    const section = this.parseSection(rawSection);
    const schema = SECTION_SCHEMAS[section];

    const parsed = schema.safeParse(rawContent);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid section content',
        details: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const upserted = await this.prisma.siteSettings.upsert({
      where: { tenantId_section: { tenantId: this.tenantId, section: section as PrismaSiteSection } },
      create: {
        id: randomUUID(),
        tenantId: this.tenantId,
        section: section as PrismaSiteSection,
        content: parsed.data as never,
        updatedBy: actorId,
      },
      update: {
        content: parsed.data as never,
        updatedBy: actorId,
      },
      select: {
        section: true,
        content: true,
        updatedAt: true,
        updatedBy: true,
      },
    });

    const value: SiteSettingsRow = {
      section,
      content: upserted.content,
      updatedAt: upserted.updatedAt,
      updatedBy: upserted.updatedBy,
    };
    // Cache invalidation — overwrite the slot with the fresh value so the next
    // GET (likely the admin's own re-render) is instant.
    this.cache.set(section, { value, expiresAt: Date.now() + this.CACHE_TTL_MS });
    // Revalidate the public homepage ISR so the edit is live immediately
    // (rather than waiting up to the 5-minute revalidation window).
    this.triggerRevalidate();
    return value;
  }

  /** Coerce a path-parameter string into a typed section name. */
  private parseSection(raw: string): SiteSectionName {
    const upper = raw?.toUpperCase?.() ?? '';
    const parsed = SiteSection.safeParse(upper);
    if (!parsed.success) {
      throw new NotFoundException(`Unknown section: ${raw}`);
    }
    return parsed.data;
  }
}
