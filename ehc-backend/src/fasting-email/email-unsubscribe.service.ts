import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

const normalise = (email: string) => email.trim().toLowerCase();

/**
 * Stopping church bulk email (the daily fasting email). Each email carries a
 * link signed for its own address, so nobody can unsubscribe someone else by
 * guessing — and nothing needs storing until somebody actually opts out.
 */
@Injectable()
export class EmailUnsubscribeService {
  private readonly tenantId: string;
  private readonly secret: string;
  readonly siteUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    // A label keeps these signatures apart from anything else the secret signs.
    this.secret = `email-unsubscribe:${config.get('CMS_REVALIDATE_SECRET', { infer: true })}`;
    this.siteUrl = (config.get('FRONTEND_URL', { infer: true }) ?? 'https://www.everlastinghills.church').replace(/\/$/, '');
  }

  token(email: string): string {
    return createHmac('sha256', this.secret).update(normalise(email)).digest('base64url').slice(0, 32);
  }

  /** The page link (for people) and the one-click link (for Gmail/Yahoo's unsubscribe button). */
  links(email: string): { page: string; oneClick: string } {
    const q = `e=${encodeURIComponent(normalise(email))}&t=${this.token(email)}`;
    return { page: `${this.siteUrl}/unsubscribe?${q}`, oneClick: `${this.siteUrl}/api/unsubscribe?${q}` };
  }

  async unsubscribe(email: string, token: string): Promise<{ email: string }> {
    const expected = Buffer.from(this.token(email));
    const given = Buffer.from(token ?? '');
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
      throw new BadRequestException('This unsubscribe link is not valid.');
    }
    const address = normalise(email);
    await this.prisma.emailUnsubscribe.upsert({
      where: { tenantId_email: { tenantId: this.tenantId, email: address } },
      create: { id: randomUUID(), tenantId: this.tenantId, email: address },
      update: {},
    });
    return { email: address };
  }

  async unsubscribed(): Promise<Set<string>> {
    const rows = await this.prisma.emailUnsubscribe.findMany({ where: { tenantId: this.tenantId }, select: { email: true } });
    return new Set(rows.map((r) => r.email));
  }
}
