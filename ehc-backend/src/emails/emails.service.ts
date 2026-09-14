import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailDispatcher } from '../jobs/mail-dispatcher';
import { buildEmailBlast } from '../notifications/templates/email-blast.email';
import { escapeHtml, getEmailLogoUrl, setEmailLogoUrl } from '../notifications/templates/layout';
import { EmailsRecipientsService } from './emails-recipients.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { UpdateEmailSettingsDto } from './dto/update-email-settings.dto';
import type { Env } from '../config/env.validation';


@Injectable()
export class EmailsService implements OnModuleInit {
  private readonly logger = new Logger(EmailsService.name);
  private readonly tenantId: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailDispatcher,
    private readonly recipients: EmailsRecipientsService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.frontendUrl = (config.get('FRONTEND_URL', { infer: true }) as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:3000';
  }

  /** Push the saved header logo into the shared layout so every template —
   * not just admin blasts — renders with it from the first email after boot. */
  async onModuleInit() {
    try {
      const row = await this.prisma.emailSettings.findUnique({ where: { tenantId: this.tenantId } });
      setEmailLogoUrl(row?.logoUrl);
    } catch (err) {
      this.logger.warn(`Could not load email settings: ${(err as Error).message}`);
    }
  }

  // ── Settings (branding) ────────────────────────────────────────────────

  async getSettings() {
    const row = await this.prisma.emailSettings.findUnique({ where: { tenantId: this.tenantId } });
    return { logoUrl: row?.logoUrl ?? null, effectiveLogoUrl: getEmailLogoUrl() };
  }

  async updateSettings(dto: UpdateEmailSettingsDto, updatedBy: string | null) {
    const logoUrl = dto.logoUrl?.trim() || null;
    await this.prisma.emailSettings.upsert({
      where: { tenantId: this.tenantId },
      create: { id: randomUUID(), tenantId: this.tenantId, logoUrl, updatedBy },
      update: { logoUrl, updatedBy },
    });
    setEmailLogoUrl(logoUrl);
    return this.getSettings();
  }

  // ── Templates ──────────────────────────────────────────────────────────

  async createTemplate(dto: CreateEmailTemplateDto, createdById: string | null) {
    return this.prisma.emailTemplate.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: dto.name,
        subject: dto.subject,
        body: dto.body,
        createdById,
      },
    });
  }

  async listTemplates() {
    return this.prisma.emailTemplate.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findTemplateOwnedOrThrow(id: string) {
    const template = await this.prisma.emailTemplate.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!template) throw new NotFoundException('Email template not found');
    return template;
  }

  async getTemplate(id: string) {
    return this.findTemplateOwnedOrThrow(id);
  }

  async updateTemplate(id: string, dto: UpdateEmailTemplateDto) {
    await this.findTemplateOwnedOrThrow(id);
    return this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.body !== undefined && { body: dto.body }),
      },
    });
  }

  async removeTemplate(id: string) {
    await this.findTemplateOwnedOrThrow(id);
    await this.prisma.emailTemplate.delete({ where: { id } });
    return { id, deleted: true };
  }

  // ── Recipient preview ─────────────────────────────────────────────────

  async previewRecipients(filter: SendEmailDto['audience']) {
    const rows = await this.recipients.resolve(filter);
    return {
      count: rows.length,
      sample: rows.slice(0, 5).map((r) => ({ name: r.name, email: r.email })),
    };
  }

  // ── Send ───────────────────────────────────────────────────────────────

  async send(dto: SendEmailDto, sentById: string | null) {
    const rows = await this.recipients.resolve(dto.audience);
    const audienceLabel = await this.recipients.describe(dto.audience);

    const BATCH = 8;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      await Promise.all(
        batch.map((r) =>
          this.mail.dispatch(
            buildEmailBlast({ email: r.email, subject: dto.subject, body: dto.body, attachments: dto.attachments }),
          ),
        ),
      );
      if (i + BATCH < rows.length) {
        await new Promise((r) => setTimeout(r, 1_100));
      }
    }

    this.logger.log(`Email "${dto.subject}" sent to ${rows.length} recipient(s) (${audienceLabel})`);

    return this.prisma.emailSend.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        templateId: dto.templateId ?? null,
        subject: dto.subject,
        body: dto.body,
        audienceMode: dto.audience.mode,
        audienceLabel,
        recipients: rows.length,
        attachments: dto.attachments?.length ? dto.attachments.map((a) => ({ name: a.name, url: a.url })) : undefined,
        sentById,
      },
    });
  }

  // ── System-triggered notifications (new sermon / new course) ────────────

  /**
   * Fire-and-forget: callers (sermon/course creation) don't await this, so a
   * slow or failing send never blocks the response. Logged, not thrown.
   */
  async notifyNewContent(args: { kind: 'sermon' | 'course'; title: string; path: string }) {
    const isSermon = args.kind === 'sermon';
    const subject = `New ${isSermon ? 'Sermon' : 'Course'}: ${args.title}`;
    const url = `${this.frontendUrl}${args.path}`;
    const body = `<p>${isSermon ? 'A new sermon just went live' : 'A new course is now available'} at Everlasting Hills — <strong>${escapeHtml(args.title)}</strong>.</p><p><a href="${url}" style="color:#87102C;font-weight:700">${isSermon ? 'Watch it now' : 'Start learning'} →</a></p>`;

    try {
      await this.send({ subject, body, audience: { mode: 'ALL' } }, null);
    } catch (err) {
      this.logger.error(`Failed to send "${subject}" notification: ${err instanceof Error ? err.message : err}`);
    }
  }

  async listSent(pageInput?: string, limitInput?: string) {
    const page = Math.max(1, Number(pageInput ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitInput ?? 20) || 20));

    const [rows, total] = await Promise.all([
      this.prisma.emailSend.findMany({
        where: { tenantId: this.tenantId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.emailSend.count({ where: { tenantId: this.tenantId } }),
    ]);

    return {
      data: rows,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }
}
