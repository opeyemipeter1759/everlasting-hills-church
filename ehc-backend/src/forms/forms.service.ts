import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ContactDto } from './dto/contact.dto';
import { FirstTimerDto } from './dto/first-timer.dto';
import { PrayerRequestDto } from './dto/prayer-request.dto';
import { ServeTeamDto } from './dto/serve-team.dto';
import { TestimonyDto } from './dto/testimony.dto';
import {
  NotificationEvents,
  type SendEmailPayload,
} from '../notifications/notification-events';
import type { Env } from '../config/env.validation';
import { buildFirstTimerWelcomeEmail } from '../notifications/templates/first-timer-welcome.email';
import { buildFirstTimerAdminEmail } from '../notifications/templates/first-timer-admin.email';

const MONTH_INDEX: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7,
  september: 8, sep: 8, sept: 8, october: 9, oct: 9, november: 10, nov: 10,
  december: 11, dec: 11,
};

/**
 * The first-timer form collects a birthday as day + month name (no year).
 * Compose them into an ISO date string (sentinel year 2000 — only day/month
 * are meaningful) so it can be stored on the Visitor and later carried to the
 * Member on conversion. Returns null when either part is missing/invalid.
 */
export function composeBirthdayIso(day?: string, month?: string): string | null {
  if (!day || !month) return null;
  const mi = MONTH_INDEX[month.trim().toLowerCase()];
  const d = parseInt(day, 10);
  if (mi === undefined || !d || d < 1 || d > 31) return null;
  return new Date(Date.UTC(2000, mi, d)).toISOString();
}

/**
 * Public form intake. Writes the record synchronously (so the user gets immediate confirmation)
 * and fires email events asynchronously via EventEmitter2 (so the response isn't held up
 * by Resend's latency or failures).
 *
 * Previously: form submissions blocked on `await Promise.allSettled(resend.emails.send(...))`,
 * adding ~500ms–2s to every form POST. Now: <100ms.
 */
@Injectable()
export class FormsService {
  private readonly tenantId: string;
  private readonly adminEmail: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.adminEmail =
      config.get('RESEND_ADMIN_EMAIL', { infer: true }) ??
      config.get('CONTACT_EMAIL', { infer: true }) ??
      'hello@everlastinghills.org';
    this.appUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ??
      'http://localhost:3000';
  }

  // ── Email payload builders ──────────────────────────────────────────────────

  private buildPrayerAdminText(d: PrayerRequestDto): string {
    const displayName = d.is_anonymous ? 'Anonymous' : d.name?.trim() || 'Anonymous';
    return [
      `Name: ${displayName}`,
      `Email: ${d.email ?? '—'}`,
      `Phone: ${d.phone ?? '—'}`,
      '',
      'Request:',
      d.request,
    ].join('\n');
  }

  private buildPrayerVisitorText(d: PrayerRequestDto): string {
    const displayName = d.is_anonymous ? 'Anonymous' : d.name?.trim() || 'Anonymous';
    return [
      `Dear ${displayName},`,
      '',
      'We have received your prayer request and will be praying with you.',
      'Our team will follow up if needed.',
      '',
      'God bless you,',
      'Everlasting Hills Church',
    ].join('\n');
  }

  private buildTestimonyAdminText(d: TestimonyDto): string {
    return [
      `Name: ${d.name?.trim() || 'Anonymous'}`,
      `Email: ${d.email ?? '—'}`,
      `Phone: ${d.phone ?? '—'}`,
      '',
      `Title: ${d.title ?? 'N/A'}`,
      '',
      'Testimony:',
      d.testimony ?? 'N/A',
    ].join('\n');
  }

  private buildTestimonyVisitorText(d: TestimonyDto): string {
    return [
      `Dear ${d.name?.trim() || 'Beloved'},`,
      '',
      'Thank you for sharing your testimony with Everlasting Hills Church.',
      'We celebrate what God has done in your life.',
      '',
      'God bless you,',
      'Everlasting Hills Church',
    ].join('\n');
  }

  /**
   * Fire-and-forget email dispatch. Never awaits — failures are logged by
   * NotificationsService.handleSendEmail. Returns synchronously.
   */
  private dispatchEmail(payload: SendEmailPayload) {
    this.events.emit(NotificationEvents.SendEmail, payload);
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  async submitFirstTimer(data: FirstTimerDto) {
    const normalizedEmail = data.email?.trim();
    const normalizedPhone = data.phone_number.trim();

    if (normalizedEmail) {
      const existing = await this.prisma.visitor.findFirst({
        where: { email: normalizedEmail, tenantId: this.tenantId },
      });
      if (existing) {
        throw new BadRequestException(
          `A visitor with email "${normalizedEmail}" already exists`,
        );
      }
    }
    if (normalizedPhone) {
      const existing = await this.prisma.visitor.findFirst({
        where: { phone: normalizedPhone, tenantId: this.tenantId },
      });
      if (existing) {
        throw new BadRequestException(
          `A visitor with phone number "${normalizedPhone}" already exists`,
        );
      }
    }

    const [visitor] = await Promise.all([
      this.prisma.visitor.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          firstName: data.first_name.trim(),
          lastName: data.last_name.trim(),
          phone: normalizedPhone,
          email: normalizedEmail ?? null,
          gender: data.gender ?? null,
          dateOfBirth: composeBirthdayIso(data.birth_day, data.birth_month),
          attendanceType: data.attendance_type ?? null,
          howDidYouLearn: data.how_did_you_learn ?? null,
          invitedBy: data.invited_by ?? null,
          locatedInIbadan: data.located_in_ibadan ?? null,
          membershipInterest: data.membership_interest ?? null,
          address: data.address ?? null,
          occupation: data.occupation ?? null,
          bornAgain: data.born_again ?? null,
          serviceExperience: data.service_experience ?? null,
          prayerPoint: data.prayer_point ?? null,
          whatsappInterest: data.whatsapp_interest ?? null,
        },
      }),
      this.prisma.formSubmission.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          type: 'first_timer',
          data: data as unknown as Prisma.InputJsonValue,
        },
      }),
    ]);

    // Fire-and-forget — does not block response.
    // Admin/pastoral team: full details + review & assign-for-follow-up CTAs.
    this.dispatchEmail(
      buildFirstTimerAdminEmail({ data, adminEmail: this.adminEmail, appUrl: this.appUrl }),
    );
    // The guest: warm welcome with service times, address, and ways to connect.
    if (normalizedEmail) {
      this.dispatchEmail(
        buildFirstTimerWelcomeEmail({
          firstName: data.first_name.trim(),
          email: normalizedEmail,
          appUrl: this.appUrl,
        }),
      );
    }

    return {
      success: true,
      message: 'First timer registration submitted successfully',
      visitor,
    };
  }

  async submitPrayerRequest(data: PrayerRequestDto) {
    const normalizedEmail = data.email?.trim();
    const normalizedPhone = data.phone?.trim();
    const displayName = data.is_anonymous ? 'Anonymous' : data.name?.trim() || 'Anonymous';

    const record = await this.prisma.prayerRequest.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        request: data.request.trim(),
        name: data.name ? data.name.trim() : null,
        email: normalizedEmail ?? null,
        phone: normalizedPhone ?? null,
        isAnonymous: data.is_anonymous ?? false,
      },
    });

    this.dispatchEmail({
      to: this.adminEmail,
      subject: `New Prayer Request from ${displayName}`,
      text: this.buildPrayerAdminText(data),
      tag: 'prayer-admin',
    });
    if (normalizedEmail) {
      this.dispatchEmail({
        to: normalizedEmail,
        subject: 'We received your prayer request',
        text: this.buildPrayerVisitorText(data),
        tag: 'prayer-visitor',
      });
    }

    return {
      success: true,
      message: 'Prayer request submitted successfully',
      data: record,
    };
  }

  async submitTestimony(data: TestimonyDto) {
    const normalizedEmail = data.email?.trim();
    const normalizedName = data.name?.trim();
    const normalizedPhone = data.phone?.trim();
    const normalizedTitle = data.title?.trim();

    const contact = [normalizedEmail, normalizedPhone].filter(Boolean).join(' · ');
    const content = normalizedTitle
      ? `${normalizedTitle}\n\n${data.testimony.trim()}`
      : data.testimony.trim();

    // Land it directly in the Testimonial table (unpublished) so it shows up as a draft on
    // the pastor's testimonials CMS page, ready for review/publish — not just a write-only
    // FormSubmission log no admin UI ever reads.
    const [record] = await Promise.all([
      this.prisma.testimonial.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          authorName: normalizedName || 'Anonymous',
          authorRole: contact || null,
          content,
          published: false,
          order: 0,
          updatedAt: new Date(),
        },
      }),
      this.prisma.formSubmission.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          type: 'testimony',
          data: data as unknown as Prisma.InputJsonValue,
        },
      }),
    ]);

    this.dispatchEmail({
      to: this.adminEmail,
      subject: `New Testimony${normalizedName ? ` from ${normalizedName}` : ''}`,
      text: this.buildTestimonyAdminText(data),
      tag: 'testimony-admin',
    });
    if (normalizedEmail) {
      this.dispatchEmail({
        to: normalizedEmail,
        subject: 'Thank you for your testimony',
        text: this.buildTestimonyVisitorText(data),
        tag: 'testimony-visitor',
      });
    }

    return {
      success: true,
      message: 'Testimony submitted successfully',
      data: record,
    };
  }

  async submitServeTeam(data: ServeTeamDto) {
    const normalizedEmail = data.email.trim();
    const normalizedName = data.name.trim();

    const record = await this.prisma.formSubmission.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        type: 'serve_team',
        data: data as unknown as Prisma.InputJsonValue,
      },
    });

    this.dispatchEmail({
      to: this.adminEmail,
      subject: `New Serve Team Interest: ${normalizedName} → ${data.unit}`,
      text: [
        `Name: ${normalizedName}`,
        `Email: ${normalizedEmail}`,
        `Phone: ${data.phone?.trim() ?? '—'}`,
        `Team: ${data.unit}`,
        '',
        `Message: ${data.message?.trim() ?? '—'}`,
      ].join('\n'),
      tag: 'serve-team-admin',
    });

    this.dispatchEmail({
      to: normalizedEmail,
      subject: 'Your serve team interest — Everlasting Hills Church',
      text: [
        `Dear ${normalizedName.split(/\s+/)[0]},`,
        '',
        `Thank you for expressing interest in joining the ${data.unit} at Everlasting Hills Church.`,
        'Our team will be in touch with you soon.',
        '',
        'God bless you,',
        'Everlasting Hills Church',
      ].join('\n'),
      tag: 'serve-team-visitor',
    });

    return {
      success: true,
      message: 'Serve team interest submitted successfully',
      data: record,
    };
  }

  async submitContact(data: ContactDto) {
    const normalizedEmail = data.email.trim();
    const normalizedName = data.name.trim();

    const record = await this.prisma.contactMessage.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: normalizedName,
        email: normalizedEmail,
        message: data.message.trim(),
      },
    });

    const subjectLine = data.subject?.trim()
      ? `[Contact] ${data.subject.trim()}`
      : `New contact message from ${normalizedName}`;

    this.dispatchEmail({
      to: this.adminEmail,
      subject: subjectLine,
      text: [
        `Name: ${normalizedName}`,
        `Email: ${normalizedEmail}`,
        `Phone: ${data.phone?.trim() ?? '—'}`,
        '',
        'Message:',
        data.message.trim(),
      ].join('\n'),
      tag: 'contact-admin',
    });

    this.dispatchEmail({
      to: normalizedEmail,
      subject: 'We received your message',
      text: [
        `Dear ${normalizedName.split(/\s+/)[0]},`,
        '',
        'Thanks for reaching out to Everlasting Hills Church. Our team will get back to you shortly.',
        '',
        'God bless you,',
        'Everlasting Hills Church',
      ].join('\n'),
      tag: 'contact-visitor',
    });

    return {
      success: true,
      message: 'Contact message submitted successfully',
      data: record,
    };
  }
}
