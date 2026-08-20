import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import type { Env } from '../../config/env.validation';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../../notifications/member-welcome-email';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeGender, parseBirthday } from '../members-supabase-admin.util';
import { MemberAuthProvisioningService } from './member-auth-provisioning.service';

/** Converts a Visitor into a member using a coordinated auth + database flow. */
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
    this.appUrl = config.get('FRONTEND_URL', { infer: true }) ?? 'http://localhost:3000';
  }

  async convertVisitorToMember(visitorId: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (!visitor.email) {
      throw new BadRequestException('Visitor has no email - email is required to create an account');
    }

    const existing = await this.prisma.member.findFirst({
      where: { tenantId: this.tenantId, email: visitor.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A member account already exists for this email address');
    }

    const provisioned = await this.authProvisioning.createOrReuseAuthUser(visitor.email);

    let member;
    try {
      member = await this.prisma.$transaction(async (tx) => {
        const profile = await tx.profile.create({
          data: {
            id: randomUUID(),
            userId: provisioned.userId,
            tenantId: this.tenantId,
          },
        });

        await tx.roleAssignment.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            profileId: profile.id,
            role: 'MEMBER',
          },
        });

        const createdMember = await tx.member.create({
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

        await tx.visitor.update({
          where: { id: visitor.id },
          data: { convertedAt: new Date(), convertedToMemberId: createdMember.id },
        });
        return createdMember;
      });
    } catch (error) {
      // Supabase cannot join the SQL transaction. Compensate only for an identity
      // created by this call; never delete a pre-existing orphan identity.
      if (provisioned.created) {
        await this.authProvisioning.rollbackCreatedAuthUser(provisioned.userId);
      }
      throw error;
    }

    const passwordSetupEmailSent = await this.authProvisioning.sendPasswordSetupEmail(visitor.email);
    this.events.emit(
      NotificationEvents.SendEmail,
      buildMemberWelcomeEmail({
        firstName: visitor.firstName,
        email: visitor.email,
        appUrl: this.appUrl,
        source: 'visitor-converted',
        memberId: member.id,
      }),
    );

    return { ...member, passwordSetupEmailSent };
  }
}
