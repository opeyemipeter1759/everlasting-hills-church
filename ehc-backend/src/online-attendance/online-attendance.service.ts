import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationEvents, type SendEmailPayload } from '../notifications/notification-events';
import type { Env } from '../config/env.validation';

@Injectable()
export class OnlineAttendanceService {
  private readonly logger = new Logger(OnlineAttendanceService.name);
  private readonly tenantId: string;
  private readonly adminEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.adminEmail =
      (config.get('RESEND_ADMIN_EMAIL' as any, { infer: true }) as string | undefined) ??
      'hello@everlastinghills.org';
  }

  /**
   * Called when a second-time visitor submits their email.
   * - Email not in Visitor table → they're actually a first-timer, redirect to form
   * - Email found → record as SECOND_TIMER, send them a holding email, notify admin
   */
  async checkIn(email: string) {
    const normEmail = email.trim().toLowerCase();

    const visitor = await this.prisma.visitor.findFirst({
      where: { tenantId: this.tenantId, email: normEmail },
      select: { firstName: true, lastName: true },
    });

    if (!visitor) {
      return { action: 'redirect_first_timer' };
    }

    const displayName = `${visitor.firstName} ${visitor.lastName}`.trim();

    // Use a fixed channel key since online check-ins aren't channel-specific here
    const channel = 'YOUTUBE' as const;

    const existing = await this.prisma.onlineCheckIn.findUnique({
      where: { tenantId_email_channel: { tenantId: this.tenantId, email: normEmail, channel } },
    });

    if (existing) {
      await this.prisma.onlineCheckIn.update({
        where: { id: existing.id },
        data: { visitCount: existing.visitCount + 1, lastCheckedIn: new Date() },
      });
      this.logger.log(`Online returning check-in: ${normEmail} (visit #${existing.visitCount + 1})`);
      return { action: 'checked_in', stage: existing.stage, visitCount: existing.visitCount + 1 };
    }

    await this.prisma.onlineCheckIn.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        email: normEmail,
        name: displayName,
        channel,
        stage: 'SECOND_TIMER',
        visitCount: 2,
        lastCheckedIn: new Date(),
      },
    });

    this.logger.log(`Online second-timer: ${normEmail}`);
    this.sendSecondTimerEmail(normEmail, displayName);
    this.notifyAdmin(normEmail, displayName);

    return { action: 'checked_in', stage: 'SECOND_TIMER', visitCount: 1 };
  }

  async list(opts: { channel?: string; stage?: string; take: number; skip: number }) {
    const where = {
      tenantId: this.tenantId,
      ...(opts.channel ? { channel: opts.channel } : {}),
      ...(opts.stage ? { stage: opts.stage } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.onlineCheckIn.findMany({
        where,
        orderBy: { lastCheckedIn: 'desc' },
        take: Math.min(opts.take, 200),
        skip: opts.skip,
      }),
      this.prisma.onlineCheckIn.count({ where }),
    ]);

    return { data: records, meta: { total, take: opts.take, skip: opts.skip } };
  }

  private sendSecondTimerEmail(email: string, name: string) {
    const firstName = name.split(/\s+/)[0] || 'Friend';

    const payload: SendEmailPayload = {
      to: email,
      tag: 'online-second-timer',
      subject: `We see you — welcome back to Everlasting Hills`,
      text: [
        `Hi ${firstName},`,
        '',
        `We're so glad you joined us online for the second time.`,
        '',
        `Our team has noted your attendance and will be setting up a personal account for you shortly. Once it's ready, you'll receive another email with your login details.`,
        '',
        `Your account will give you access to sermon notes, events, and the full Everlasting Hills community online.`,
        '',
        `If you have any questions in the meantime, just reply to this email.`,
        '',
        `With love,`,
        `Everlasting Hills Church`,
      ].join('\n'),
    };

    this.events.emit(NotificationEvents.SendEmail, payload);
  }

  private notifyAdmin(email: string, name: string) {
    const payload: SendEmailPayload = {
      to: this.adminEmail,
      tag: 'online-attendance-admin',
      subject: `[Online Second Timer] ${name} — account needed`,
      text: [
        `${name} has joined the online service for the second time.`,
        '',
        `  Name:  ${name}`,
        `  Email: ${email}`,
        '',
        `Please create an account for them from the admin dashboard → First Timers.`,
      ].join('\n'),
    };

    this.events.emit(NotificationEvents.SendEmail, payload);
  }
}
