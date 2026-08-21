import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { generateUnusableInitialPassword, passwordSetupRedirect } from '../../auth/secure-provisioning';
import type { AuthUser } from '../../auth/types/auth-user';
import type { Env } from '../../config/env.validation';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../../notifications/member-welcome-email';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateUserDto } from '../dto/user.dto';
import { GRANTED_ROLES } from '../users.types';
import { UsersAuthService } from './users-auth.service';
import { UsersSupabaseAdminService } from './users-supabase-admin.service';

/** Coordinated Supabase identity + transactional Profile/Member creation. */
@Injectable()
export class UsersCreateService {
  private readonly logger = new Logger(UsersCreateService.name);
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly auth: UsersAuthService,
    private readonly supabaseAdmin: UsersSupabaseAdminService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = config.get('FRONTEND_URL', { infer: true }) ?? 'http://localhost:3000';
  }

  async create(actor: AuthUser, data: CreateUserDto) {
    this.auth.assertCanActOn(actor, data.role);
    const normalizedEmail = data.email.toLowerCase().trim();

    const existing = await this.prisma.member.findFirst({
      where: { email: normalizedEmail, tenantId: this.tenantId },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(`A user with email "${normalizedEmail}" already exists`);
    }

    const client = this.supabaseAdmin.getClient();
    const { data: created, error } = await client.auth.admin.createUser({
      email: normalizedEmail,
      password: generateUnusableInitialPassword(),
      email_confirm: true,
      app_metadata: { role: data.role },
      user_metadata: {
        role: data.role,
        full_name: `${data.firstName} ${data.lastName}`.trim(),
        needs_password_change: true,
      },
    });
    if (error || !created.user) {
      throw new BadRequestException(
        `Could not create auth user: ${error?.message ?? 'unknown error'}`,
      );
    }

    const supabaseUserId = created.user.id;
    let result;
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const profile = await tx.profile.create({
          data: { id: randomUUID(), userId: supabaseUserId, tenantId: this.tenantId },
        });

        if (GRANTED_ROLES.includes(data.role)) {
          await tx.roleGrant.create({
            data: {
              id: randomUUID(),
              tenantId: this.tenantId,
              userId: profile.id,
              role: data.role,
              grantedById: actor.profileId ?? null,
            },
          });
        } else if (data.role === Role.HEAD_USHER) {
          await tx.headUsherAssignment.create({
            data: {
              id: randomUUID(),
              tenantId: this.tenantId,
              userId: profile.id,
              assignedById: actor.profileId ?? null,
            },
          });
        }

        const member = await tx.member.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            profileId: profile.id,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: normalizedEmail,
            phone: data.phone.trim(),
            ...(data.gender ? { gender: data.gender } : {}),
          },
        });
        return { profile, member };
      });
    } catch (dbError) {
      this.logger.error(`DB create failed after auth creation; rolling back ${normalizedEmail}`);
      const { error: rollbackError } = await client.auth.admin.deleteUser(supabaseUserId);
      if (rollbackError) {
        this.logger.error(`Failed to roll back auth user ${supabaseUserId}: ${rollbackError.message}`);
      }
      throw dbError;
    }

    // The user chooses a password through Supabase's signed, expiring recovery
    // link. No phone number or shared default password is ever disclosed.
    const { error: setupError } = await client.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: passwordSetupRedirect(this.appUrl),
    });
    if (setupError) {
      this.logger.error(`Could not send password setup email to ${normalizedEmail}: ${setupError.message}`);
    }

    this.events.emit(
      NotificationEvents.SendEmail,
      buildMemberWelcomeEmail({
        firstName: data.firstName.trim(),
        email: normalizedEmail,
        appUrl: this.appUrl,
        source: 'admin-created',
        memberId: result.member.id,
      }),
    );
    this.logger.log(`[${actor.email}] created ${data.role}: ${normalizedEmail}`);

    return {
      profileId: result.profile.id,
      userId: supabaseUserId,
      role: data.role,
      member: result.member,
      passwordSetupEmailSent: !setupError,
    };
  }
}
