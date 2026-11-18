import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { MessageTemplate } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import type { SendEmailPayload } from '../notifications/notification-events';
import { buildFirstTimerWelcomeEmail } from '../notifications/templates/first-timer-welcome.email';
import { PipelineRepository } from '../pipeline/pipeline.repository';
import type { PipelineRow } from '../pipeline/pipeline.types';
import { FollowUpAuthService } from '../follow-up/services/follow-up-auth.service';
import { stampFirstContact } from '../follow-up/first-contact';
import { MessageTemplatesService } from './message-templates.service';
import { canSendOpening, requireOpeningSender } from './opening-access';
import { renderOpeningEmail, renderWhatsApp, valuesFor, waMeLink, type Sender } from './opening-message.render';
import { OPENING_KEY } from './template-variables';

/**
 * Sending the opening message. Every send is rendered from the version in use
 * at that moment, writes a MessageLog row (who, which channel, which version,
 * who sent it, when), and counts as a contact: the first contact of any kind
 * sets first_contacted_at. It goes out on WhatsApp; nobody emails it by hand
 * (new first-timers get the church's welcome email automatically).
 */
@Injectable()
export class OpeningMessageService {
  private readonly tenantId: string;
  private readonly appUrl: string;
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: MessageTemplatesService,
    private readonly pipeline: PipelineRepository,
    private readonly auth: FollowUpAuthService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ?? 'https://www.everlastinghills.church';
  }

  /** The profile's view: what a send would say, and every send so far. */
  async context(actor: AuthUser, visitorId: string) {
    await this.auth.requireAccess(actor);
    const person = await this.person(visitorId);
    const canSend = canSendOpening(actor);
    const active = canSend ? await this.templates.active(OPENING_KEY) : null;
    const whatsapp = active ? this.whatsappFor(person, active, await this.sender(actor)) : null;
    return {
      canSend,
      template: active ? { key: OPENING_KEY, version: active.version } : null,
      whatsapp,
      sends: await this.sends(visitorId),
    };
  }

  /** The editor's live preview: a draft, or the version in use, filled in for one real first-timer by this sender. */
  async preview(actor: AuthUser, input: { visitorId: string; whatsappBody?: string; emailSubject?: string; emailBody?: string }) {
    requireOpeningSender(actor);
    const person = await this.person(input.visitorId);
    const active = await this.templates.active(OPENING_KEY);
    const content = {
      whatsappBody: input.whatsappBody ?? active?.whatsappBody ?? '',
      emailSubject: input.emailSubject ?? active?.emailSubject ?? '',
      emailBody: input.emailBody ?? active?.emailBody ?? '',
    };
    const values = valuesFor(person.firstName, await this.sender(actor));
    const text = renderWhatsApp(content, values);
    const email = renderOpeningEmail({ content, values, to: person.email ?? 'preview@example.com', appUrl: this.appUrl });
    return {
      person: { visitorId: person.visitorId, firstName: person.firstName, lastName: person.lastName },
      whatsapp: { text, length: text.length },
      email: { subject: email.subject, text: email.text, html: email.html },
    };
  }

  /** Logs a WhatsApp send when she taps the button (the link itself opens on her phone). */
  async logWhatsApp(actor: AuthUser, visitorId: string, templateVersion: number) {
    requireOpeningSender(actor);
    await this.person(visitorId);
    if (!(await this.templates.version(OPENING_KEY, templateVersion))) throw new BadRequestException('That message version does not exist');
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.messageLog.create({
        data: {
          id: randomUUID(), tenantId: this.tenantId, visitorId, channel: 'whatsapp',
          templateKey: OPENING_KEY, templateVersion, sentById: actor.profileId ?? null, status: 'SENT', sentAt: now,
        },
      });
      return stampFirstContact(tx, { tenantId: this.tenantId, visitorId, at: now, actorId: actor.profileId ?? null });
    });
    return { logged: true, firstContact: result.stamped };
  }

  /**
   * The automatic welcome email a first-timer gets when they register, from the
   * opening template, signed by the church's first-timer contact. With no
   * template saved yet it falls back to the original welcome email.
   */
  async renderWelcomeEmail(visitor: { firstName: string; email: string }): Promise<{ payload: SendEmailPayload; templateVersion: number | null }> {
    const active = await this.templates.active(OPENING_KEY);
    if (!active) {
      return { payload: buildFirstTimerWelcomeEmail({ firstName: visitor.firstName, email: visitor.email, appUrl: this.appUrl }), templateVersion: null };
    }
    const payload = renderOpeningEmail({
      content: active, values: valuesFor(visitor.firstName, await this.currentContact()), to: visitor.email,
      appUrl: this.appUrl, tag: 'first-timer-welcome',
    });
    return { payload, templateVersion: active.version };
  }

  /** Records the automatic welcome in the message log. It is not a contact by a person, so first_contacted_at is left alone. */
  async logAutomaticWelcome(visitorId: string, templateVersion: number): Promise<void> {
    await this.prisma.messageLog.create({
      data: {
        id: randomUUID(), tenantId: this.tenantId, visitorId, channel: 'email',
        templateKey: OPENING_KEY, templateVersion, sentById: null, status: 'SENT',
      },
    });
  }

  whatsappFor(person: PipelineRow, active: MessageTemplate, sender: Sender) {
    const text = renderWhatsApp(active, valuesFor(person.firstName, sender));
    const link = waMeLink(person.phone, text);
    return link ? { text, link, templateVersion: active.version } : null;
  }

  /** The sender's own name and phone, read at send time. */
  async sender(actor: AuthUser): Promise<Sender> {
    if (!actor.memberId) return { name: null, phone: null };
    const m = await this.prisma.member.findFirst({ where: { id: actor.memberId, tenantId: this.tenantId }, select: { firstName: true, phone: true } });
    return { name: m?.firstName ?? null, phone: m?.phone ?? null };
  }

  /** Whoever most recently became the first-timer contact, for mail that has no sender of its own. */
  private async currentContact(): Promise<Sender> {
    const holder = await this.prisma.firstTimerContactAssignment.findFirst({
      where: { tenantId: this.tenantId, endedAt: null },
      orderBy: { assignedAt: 'desc' },
      select: { userId: true },
    });
    if (!holder) return { name: null, phone: null };
    const m = await this.prisma.member.findFirst({ where: { tenantId: this.tenantId, profileId: holder.userId }, select: { firstName: true, phone: true } });
    return { name: m?.firstName ?? null, phone: m?.phone ?? null };
  }

  /** One first-timer through the pipeline: tenant-scoped, and archived forms are not found. */
  private async person(visitorId: string): Promise<PipelineRow> {
    const person = await this.pipeline.one(visitorId);
    if (!person) throw new NotFoundException('First-timer not found');
    return person;
  }

  private async sends(visitorId: string) {
    const logs = await this.prisma.messageLog.findMany({
      where: { tenantId: this.tenantId, visitorId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
    const senderIds = [...new Set(logs.map((l) => l.sentById).filter((id): id is string => !!id))];
    const members = senderIds.length
      ? await this.prisma.member.findMany({ where: { tenantId: this.tenantId, profileId: { in: senderIds } }, select: { profileId: true, firstName: true, lastName: true } })
      : [];
    const names = new Map(members.map((m) => [m.profileId, `${m.firstName} ${m.lastName}`]));
    return logs.map((l) => ({
      id: l.id,
      channel: l.channel,
      templateVersion: l.templateVersion,
      status: l.status,
      error: l.error,
      sentAt: l.sentAt.toISOString(),
      automatic: !l.sentById,
      sentByName: l.sentById ? (names.get(l.sentById) ?? null) : null,
    }));
  }
}
