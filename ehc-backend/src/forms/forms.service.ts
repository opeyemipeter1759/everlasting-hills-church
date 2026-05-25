import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { FirstTimerDto, PrayerRequestDto, TestimonyDto } from '../dto';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  private getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }

    return new Resend(apiKey);
  }

  private buildAdminText(data: FirstTimerDto) {
    return [
      'New first timer registration received.',
      '',
      `Name: ${data.first_name} ${data.last_name}`,
      `Phone: ${data.phone_number}`,
      `Email: ${data.email ?? 'N/A'}`,
      `Attendance: ${data.attendance_type ?? 'N/A'}`,
      `How they learned about us: ${data.how_did_you_learn ?? 'N/A'}`,
      `Invited by: ${data.invited_by ?? 'N/A'}`,
      `Located in Ibadan: ${data.located_in_ibadan ?? 'N/A'}`,
      `Membership interest: ${data.membership_interest ?? 'N/A'}`,
      `Address: ${data.address ?? 'N/A'}`,
      `Occupation: ${data.occupation ?? 'N/A'}`,
      `Born again: ${data.born_again ?? 'N/A'}`,
      `Service experience: ${data.service_experience ?? 'N/A'}`,
      `Prayer point: ${data.prayer_point ?? 'N/A'}`,
      `WhatsApp interest: ${data.whatsapp_interest ?? 'N/A'}`,
      `Birth day: ${data.birth_day ?? 'N/A'}`,
      `Birth month: ${data.birth_month ?? 'N/A'}`,
      `Type: ${data.type ?? 'N/A'}`,
    ].join('\n');
  }

  private buildVisitorText(data: FirstTimerDto) {
    return [
      `Dear ${data.first_name},`,
      '',
      'Thank you for registering with Everlasting Hills Church.',
      'We have received your information and our team will be in touch soon.',
      '',
      'God bless you,',
      'Everlasting Hills Church',
    ].join('\n');
  }

  private buildPrayerRequestAdminText(data: PrayerRequestDto) {
    const displayName = data.is_anonymous ? 'Anonymous' : (data.name?.trim() || 'Anonymous');

    return [
      `Name: ${displayName}`,
      `Email: ${data.email ?? '—'}`,
      `Phone: ${data.phone ?? '—'}`,
      '',
      'Request:',
      data.request,
    ].join('\n');
  }

  private buildPrayerRequestVisitorText(data: PrayerRequestDto) {
    const displayName = data.is_anonymous ? 'Anonymous' : (data.name?.trim() || 'Anonymous');

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

  private buildTestimonyAdminText(data: TestimonyDto) {
    return [
      `Name: ${data.name?.trim() || 'Anonymous'}`,
      `Email: ${data.email ?? '—'}`,
      `Phone: ${data.phone ?? '—'}`,
      '',
      `Title: ${data.title ?? 'N/A'}`,
      '',
      'Testimony:',
      data.testimony ?? 'N/A',
    ].join('\n');
  }

  private buildTestimonyVisitorText(data: TestimonyDto) {
    return [
      `Dear ${data.name?.trim() || 'Beloved'},`,
      '',
      'Thank you for sharing your testimony with Everlasting Hills Church.',
      'We celebrate what God has done in your life.',
      '',
      'God bless you,',
      'Everlasting Hills Church',
    ].join('\n');
  }

  async submitFirstTimer(data: FirstTimerDto) {
    const TENANT_ID = process.env.DEFAULT_TENANT_ID!;
    const normalizedEmail = data.email?.trim();
    const normalizedPhone = data.phone_number.trim();

    if (normalizedEmail) {
      const existingEmail = await this.prisma.visitor.findFirst({
        where: {
          email: normalizedEmail,
          tenantId: TENANT_ID,
        },
      });
      if (existingEmail) {
        throw new BadRequestException(
          `A visitor with email "${normalizedEmail}" already exists`,
        );
      }
    }

    if (normalizedPhone) {
      const existingPhone = await this.prisma.visitor.findFirst({
        where: {
          phone: normalizedPhone,
          tenantId: TENANT_ID,
        },
      });
      if (existingPhone) {
        throw new BadRequestException(
          `A visitor with phone number "${normalizedPhone}" already exists`,
        );
      }
    }

    const [visitor] = await Promise.all([
      this.prisma.visitor.create({
        data: {
          id: randomUUID(),
          tenantId: TENANT_ID,
          firstName: data.first_name.trim(),
          lastName: data.last_name.trim(),
          phone: normalizedPhone,
          email: normalizedEmail ?? null,
          gender: data.gender ?? null,
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
          tenantId: TENANT_ID,
          type: 'first_timer',
          data: data as unknown as Prisma.InputJsonValue,
        },
      }),
    ]);

    const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev';
    const ADMIN_EMAIL =
      process.env.RESEND_ADMIN_EMAIL ??
      process.env.CONTACT_EMAIL ??
      'hello@everlastinghills.org';

    const resend = this.getResendClient();
    const emailJobs: Promise<unknown>[] = [
      resend.emails.send({
        from: `Everlasting Hills <${FROM}>`,
        to: ADMIN_EMAIL,
        subject: `New First Timer: ${data.first_name} ${data.last_name}`,
        text: this.buildAdminText(data),
      }),
    ];

    if (normalizedEmail) {
      emailJobs.push(
        resend.emails.send({
          from: `Everlasting Hills <${FROM}>`,
          to: normalizedEmail,
          subject: 'Welcome to Everlasting Hills Church!',
          text: this.buildVisitorText(data),
        }),
      );
    }

    const results = await Promise.allSettled(emailJobs);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `[forms.service] first-timer email[${index}] failed:`,
          result.reason,
        );
      }
    });

    return {
      success: true,
      message: 'First timer registration submitted successfully',
      visitor,
    };
  }

  async submitPrayerRequest(data: PrayerRequestDto) {
    const TENANT_ID = process.env.DEFAULT_TENANT_ID!;
    const normalizedEmail = data.email?.trim();
    const normalizedPhone = data.phone?.trim();
    const displayName = data.is_anonymous ? 'Anonymous' : (data.name?.trim() || 'Anonymous');

    const record = await this.prisma.prayerRequest.create({
      data: {
        id: randomUUID(),
        tenantId: TENANT_ID,
        request: data.request.trim(),
        name: data.name ? data.name.trim() : null,
        email: normalizedEmail ?? null,
        phone: normalizedPhone ?? null,
        isAnonymous: data.is_anonymous ?? false,
      },
    });

    const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev';
    const ADMIN_EMAIL =
      process.env.RESEND_ADMIN_EMAIL ??
      process.env.CONTACT_EMAIL ??
      'hello@everlastinghills.org';

    const resend = this.getResendClient();
    const emailJobs: Promise<unknown>[] = [
      resend.emails.send({
        from: `Everlasting Hills <${FROM}>`,
        to: ADMIN_EMAIL,
        subject: `New Prayer Request from ${displayName}`,
        text: this.buildPrayerRequestAdminText(data),
      }),
    ];

    if (normalizedEmail) {
      emailJobs.push(
        resend.emails.send({
          from: `Everlasting Hills <${FROM}>`,
          to: normalizedEmail,
          subject: 'We received your prayer request',
          text: this.buildPrayerRequestVisitorText(data),
        }),
      );
    }

    const results = await Promise.allSettled(emailJobs);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `[forms.service] prayer-request email[${index}] failed:`,
          result.reason,
        );
      }
    });

    return {
      success: true,
      message: 'Prayer request submitted successfully',
      data: record,
    };
  }

  async submitTestimony(data: TestimonyDto) {
    const TENANT_ID = process.env.DEFAULT_TENANT_ID!;
    const normalizedEmail = data.email?.trim();
    const normalizedName = data.name?.trim();

    const record = await this.prisma.formSubmission.create({
      data: {
        id: randomUUID(),
        tenantId: TENANT_ID,
        type: 'testimony',
        data: data as unknown as Prisma.InputJsonValue,
      },
    });

    const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev';
    const ADMIN_EMAIL =
      process.env.RESEND_ADMIN_EMAIL ??
      process.env.CONTACT_EMAIL ??
      'hello@everlastinghills.org';

    const resend = this.getResendClient();
    const emailJobs: Promise<unknown>[] = [
      resend.emails.send({
        from: `Everlasting Hills <${FROM}>`,
        to: ADMIN_EMAIL,
        subject: `New Testimony${normalizedName ? ` from ${normalizedName}` : ''}`,
        text: this.buildTestimonyAdminText(data),
      }),
    ];

    if (normalizedEmail) {
      emailJobs.push(
        resend.emails.send({
          from: `Everlasting Hills <${FROM}>`,
          to: normalizedEmail,
          subject: 'Thank you for your testimony',
          text: this.buildTestimonyVisitorText(data),
        }),
      );
    }

    const results = await Promise.allSettled(emailJobs);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `[forms.service] testimony email[${index}] failed:`,
          result.reason,
        );
      }
    });

    return {
      success: true,
      message: 'Testimony submitted successfully',
      data: record,
    };
  }
}
