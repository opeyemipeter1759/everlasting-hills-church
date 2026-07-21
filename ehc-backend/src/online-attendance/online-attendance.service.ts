import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationEvents, type SendEmailPayload } from '../notifications/notification-events';
import type { Env } from '../config/env.validation';

type Channel = 'YOUTUBE' | 'TELEGRAM';

const CHANNEL_LABEL: Record<Channel, string> = {
  YOUTUBE: 'YouTube',
  TELEGRAM: 'Telegram',
};

@Injectable()
export class OnlineAttendanceService {
  private readonly logger = new Logger(OnlineAttendanceService.name);
  private readonly tenantId: string;
  private readonly adminEmail: string;
  private readonly supabaseUrl: string;
  private readonly supabaseServiceRoleKey: string;
  private readonly publicSiteUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.adminEmail =
      (config.get('RESEND_ADMIN_EMAIL' as any, { infer: true }) as string | undefined) ??
      'hello@everlastinghills.org';
    this.supabaseUrl = config.get('SUPABASE_URL', { infer: true });
    this.supabaseServiceRoleKey = config.get('SUPABASE_SERVICE_ROLE_KEY' as any, { infer: true }) ?? '';
    this.publicSiteUrl =
      (config.get('FRONTEND_URL' as any, { infer: true }) as string | undefined) ??
      'http://localhost:3000';
  }

  async checkIn(email: string, channel: Channel, name?: string) {
    const normEmail = email.trim().toLowerCase();
    const existing = await this.prisma.onlineCheckIn.findUnique({
      where: { tenantId_email_channel: { tenantId: this.tenantId, email: normEmail, channel } },
    });

    if (!existing) {
      // First visit — create record, redirect to first-timer form
      await this.prisma.onlineCheckIn.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          email: normEmail,
          name: name?.trim() || null,
          channel,
          stage: 'FIRST_TIMER',
          visitCount: 1,
          lastCheckedIn: new Date(),
        },
      });

      this.logger.log(`Online first-timer: ${normEmail} via ${channel}`);
      this.notifyAdmin(normEmail, name, channel, 'FIRST_TIMER');

      return { action: 'redirect_first_timer', stage: 'FIRST_TIMER' };
    }

    if (existing.stage === 'FIRST_TIMER') {
      // Second visit — create Supabase account, send password setup email
      let supabaseUserId: string | null = existing.supabaseUserId;

      if (!supabaseUserId && this.supabaseServiceRoleKey) {
        supabaseUserId = await this.createSupabaseAccount(normEmail, name ?? existing.name ?? '');
      }

      const updated = await this.prisma.onlineCheckIn.update({
        where: { id: existing.id },
        data: {
          stage: 'SECOND_TIMER',
          visitCount: existing.visitCount + 1,
          lastCheckedIn: new Date(),
          name: name?.trim() || existing.name,
          supabaseUserId,
        },
      });

      this.logger.log(`Online second-timer: ${normEmail} via ${channel}`);
      this.sendSecondTimerEmail(normEmail, name ?? existing.name ?? '', channel);
      this.notifyAdmin(normEmail, name ?? existing.name ?? '', channel, 'SECOND_TIMER');

      return { action: 'account_created', stage: 'SECOND_TIMER', visitCount: updated.visitCount };
    }

    // Third visit and beyond — online member check-in
    const updated = await this.prisma.onlineCheckIn.update({
      where: { id: existing.id },
      data: {
        stage: 'ONLINE_MEMBER',
        visitCount: existing.visitCount + 1,
        lastCheckedIn: new Date(),
        name: name?.trim() || existing.name,
      },
    });

    this.logger.log(`Online member check-in: ${normEmail} via ${channel} (visit #${updated.visitCount})`);

    return { action: 'checked_in', stage: 'ONLINE_MEMBER', visitCount: updated.visitCount };
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

  private async createSupabaseAccount(email: string, name: string): Promise<string | null> {
    try {
      const admin = createClient(this.supabaseUrl, this.supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name, role: 'ONLINE_MEMBER' },
      });

      if (error || !data.user) {
        this.logger.warn(`Supabase createUser failed for ${email}: ${error?.message}`);
        return null;
      }

      // Send password setup link via resetPasswordForEmail
      const siteUrl = this.publicSiteUrl.replace(/\/$/, '');
      const { error: resetErr } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${siteUrl}/set-password` },
      });

      if (resetErr) {
        this.logger.warn(`generateLink failed for ${email}: ${resetErr.message}`);
      }

      return data.user.id;
    } catch (err) {
      this.logger.error(`createSupabaseAccount error for ${email}`, err);
      return null;
    }
  }

  private sendSecondTimerEmail(email: string, name: string, channel: Channel) {
    const firstName = name.split(/\s+/)[0] || 'Friend';
    const channelLabel = CHANNEL_LABEL[channel];
    const loginUrl = `${this.publicSiteUrl.replace(/\/$/, '')}/login`;

    const payload: SendEmailPayload = {
      to: email,
      subject: `Welcome back — your Everlasting Hills account is ready`,
      text: [
        `Hi ${firstName},`,
        '',
        `We noticed you've been joining us online on ${channelLabel} — and we're really glad you're here.`,
        '',
        `We've created an account for you so you can stay connected with everything happening at Everlasting Hills Church.`,
        '',
        `  👉 Set your password and log in here: ${loginUrl}`,
        '',
        `Your account gives you access to:`,
        `  • Sermon notes and resources`,
        `  • Events and updates`,
        `  • Community features`,
        '',
        `If you have any questions, simply reply to this email.`,
        '',
        `We'll see you online!`,
        '',
        `With love,`,
        `Everlasting Hills Church`,
      ].join('\n'),
    };

    this.events.emit(NotificationEvents.SendEmail, payload);
  }

  private notifyAdmin(email: string, name: string | undefined, channel: Channel, stage: string) {
    const channelLabel = CHANNEL_LABEL[channel];
    const stageLabel = stage === 'FIRST_TIMER' ? 'First Timer' : 'Second Timer';

    const payload: SendEmailPayload = {
      to: this.adminEmail,
      subject: `[Online ${stageLabel}] ${name ?? email} joined via ${channelLabel}`,
      text: [
        `A new online ${stageLabel.toLowerCase()} just checked in.`,
        '',
        `  Name:    ${name ?? '—'}`,
        `  Email:   ${email}`,
        `  Channel: ${channelLabel}`,
        `  Stage:   ${stageLabel}`,
        '',
        `Log in to the admin dashboard to view their record.`,
      ].join('\n'),
    };

    this.events.emit(NotificationEvents.SendEmail, payload);
  }
}
