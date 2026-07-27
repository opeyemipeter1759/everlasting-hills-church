import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { DEFAULT_SITE_IDENTITY, SiteIdentitySchema } from '../schemas/site-config.schema';
import { CmsAuditService } from './cms-audit.service';
import { CmsRevalidateService } from './cms-revalidate.service';

/** Site-wide settings (singleton form; no draft/publish). */
@Injectable()
export class CmsSiteConfigService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: CmsAuditService,
    private readonly revalidate: CmsRevalidateService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

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
    const content = parsed.data as unknown as Prisma.InputJsonValue;
    const row = await this.prisma.siteConfig.upsert({
      where: { tenantId: this.tenantId },
      create: { id: randomUUID(), tenantId: this.tenantId, content, updatedBy: actorId ?? null },
      update: { content, updatedBy: actorId ?? null },
    });
    await this.audit.write({ action: 'UPDATE', entity: 'SiteConfig', entityId: row.id, actorId });
    // Site settings appear in the footer on every page — revalidate the tag.
    this.revalidate.trigger(['cms:site-config']);
    return { content: parsed.data, updatedAt: row.updatedAt };
  }
}
