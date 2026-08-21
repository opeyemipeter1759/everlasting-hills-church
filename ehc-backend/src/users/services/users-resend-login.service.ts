import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { generateTempPassword } from '../../auth/secure-provisioning';
import type { AuthUser } from '../../auth/types/auth-user';
import type { Env } from '../../config/env.validation';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../../notifications/member-welcome-email';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersAuthService } from './users-auth.service';
import { UsersSupabaseAdminService } from './users-supabase-admin.service';

/**
 * Resends a person's login details — same temp-password-by-email approach as
 * account creation (MemberOnboardingService / UsersCreateService), for when
 * someone lost their original email or never got it. Issues a fresh temp
 * password each time; the old one (if any) stops working immediately.
 */
@Injectable()
export class UsersResendLoginService {
  private readonly logger = new Logger(UsersResendLoginService.name);
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: UsersAuthService,
    private readonly supabaseAdmin: UsersSupabaseAdminService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = config.get('FRONTEND_URL', { infer: true }) ?? 'http://localhost:3000';
  }

  async resend(actor: AuthUser, profileId: string) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        Member: { select: { id: true, firstName: true, email: true, phone: true } },
      },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }
    this.auth.assertCanActOn(actor, await this.auth.targetPrimaryRole(profileId));

    if (!target.Member) {
      throw new BadRequestException('User has no Member record');
    }
    if (!target.Member.email) {
      throw new BadRequestException('This person has no email address on file — login details cannot be sent');
    }

    // Same phone-number-as-temp-password convention as first-timer conversion
    // (MemberAuthProvisioningService); falls back to a random one if the phone
    // is missing or shorter than Supabase's minimum password length.
    const phone = target.Member.phone?.trim();
    const tempPassword = phone && phone.length >= 6 ? phone : generateTempPassword();

    const client = this.supabaseAdmin.getClient();
    const { error } = await client.auth.admin.updateUserById(target.userId, {
      password: tempPassword,
      user_metadata: { needs_password_change: true },
    });
    if (error) {
      throw new BadRequestException(`Could not reset login details: ${error.message}`);
    }

    this.events.emit(
      NotificationEvents.SendEmail,
      buildMemberWelcomeEmail({
        firstName: target.Member.firstName,
        email: target.Member.email,
        appUrl: this.appUrl,
        source: 'admin-created',
        memberId: target.Member.id,
        tempPassword,
      }),
    );

    this.logger.log(`[${actor.email}] resent login details to ${target.Member.email}`);
    return { profileId, emailSent: true };
  }
}
