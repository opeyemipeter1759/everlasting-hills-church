import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../../notifications/member-welcome-email';
import { normalizeGender, parseBirthday } from '../members-supabase-admin.util';
import { MemberAuthProvisioningService } from './member-auth-provisioning.service';

/** Converts a single Visitor into a full Member account (Supabase auth user + Profile + Member). */
@Injectable()
export class MemberOnboardingService {
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly authProvisioning: MemberAuthProvisioningService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000';
  }

  async convertVisitorToMember(visitorId: string) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id: visitorId },
    });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (!visitor.email) {
      throw new BadRequestException(
        'Visitor has no email — email is required to create an account',
      );
    }
    if (!visitor.phone) {
      throw new BadRequestException(
        'Visitor has no phone number — phone is used as the initial password',
      );
    }

    const existing = await this.prisma.member.findFirst({
      where: { tenantId: this.tenantId, email: visitor.email },
    });
    if (existing) {
      throw new ConflictException(
        'A member account already exists for this email address',
      );
    }

    const userId = await this.authProvisioning.createOrReuseAuthUser(visitor.email, visitor.phone);

    const profile = await this.prisma.profile.create({
      data: {
        id: randomUUID(),
        userId,
        tenantId: this.tenantId,
      },
    });

    await this.prisma.roleAssignment.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        profileId: profile.id,
        role: 'MEMBER',
      },
    });

    const member = await this.prisma.member.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        profileId: profile.id,
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        email: visitor.email,
        phone: visitor.phone,
        gender: normalizeGender(visitor.gender),
        dateOfBirth: parseBirthday(visitor.dateOfBirth),
        address: visitor.address ?? null,
      },
    });

    // Mark this visitor converted so they drop off the first-timers list.
    await this.prisma.visitor.update({
      where: { id: visitor.id },
      data: { convertedAt: new Date(), convertedToMemberId: member.id },
    });

    // Fire-and-forget welcome email — sign-in link + member features they get access to.
    // Failures are logged inside NotificationsService and never block the conversion response.
    this.events.emit(
      NotificationEvents.SendEmail,
      buildMemberWelcomeEmail({
        firstName: visitor.firstName,
        email: visitor.email,
        phone: visitor.phone,
        appUrl: this.appUrl,
        source: 'visitor-converted',
        memberId: member.id,
      }),
    );

    return member;
  }
}
