import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../../notifications/member-welcome-email';
import { GRANTED_ROLES } from '../users.types';
import type { CreateUserDto } from '../dto/user.dto';
import { UsersAuthService } from './users-auth.service';
import { UsersSupabaseAdminService } from './users-supabase-admin.service';

/**
 * Admin-only user creation. Creates a Supabase auth user + Profile + Member in a
 * single coordinated flow; best-effort rolls back the Supabase user if the DB
 * portion fails, so we don't leave an orphan auth account.
 */
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
    this.appUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ?? 'http://localhost:3000';
  }

  async create(actor: AuthUser, data: CreateUserDto) {
    this.auth.assertCanActOn(actor, data.role);

    const normalizedEmail = data.email.toLowerCase().trim();

    // Reject if email already taken at the Member level (cheap check before hitting Supabase)
    const existing = await this.prisma.member.findFirst({
      where: { email: normalizedEmail, tenantId: this.tenantId },
    });
    if (existing) {
      throw new BadRequestException(`A user with email "${normalizedEmail}" already exists`);
    }

    // 1) Create Supabase auth user — phone becomes initial password (church convention).
    // `needs_password_change` is read by the login handler so the UI can route the user
    // to /change-password on their very first sign-in.
    const { data: created, error } = await this.supabaseAdmin.getClient().auth.admin.createUser({
      email: normalizedEmail,
      password: data.phone,
      email_confirm: true,
      // app_metadata.role is the authoritative, signed role claim the frontend
      // middleware verifies. user_metadata.role is kept for display/back-compat.
      app_metadata: { role: data.role },
      user_metadata: {
        role: data.role,
        full_name: `${data.firstName} ${data.lastName}`.trim(),
        needs_password_change: true,
      },
    });
    if (error || !created.user) {
      throw new BadRequestException(`Could not create auth user: ${error?.message ?? 'unknown error'}`);
    }

    const supabaseUserId = created.user.id;

    // 2) Profile + Member in one transaction — if either fails, roll back the auth user
    try {
      const profile = await this.prisma.profile.create({
        data: { id: randomUUID(), userId: supabaseUserId, tenantId: this.tenantId },
      });

      // Apply the requested role under the grants + assignments model. Granted
      // roles become a RoleGrant; HEAD_USHER an assignment. UNIT_LEAD / ADMIN_HEAD
      // are scoped and become effective once assigned to a unit / department.
      if (GRANTED_ROLES.includes(data.role)) {
        await this.prisma.roleGrant.create({
          data: { id: randomUUID(), tenantId: this.tenantId, userId: profile.id, role: data.role, grantedById: actor.profileId ?? null },
        });
      } else if (data.role === Role.HEAD_USHER) {
        await this.prisma.headUsherAssignment.create({
          data: { id: randomUUID(), tenantId: this.tenantId, userId: profile.id, assignedById: actor.profileId ?? null },
        });
      }
      const member = await this.prisma.member.create({
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

      this.logger.log(`[${actor.email}] created ${data.role}: ${normalizedEmail}`);

      // Fire-and-forget welcome email — sign-in link + the member features they get access to.
      this.events.emit(
        NotificationEvents.SendEmail,
        buildMemberWelcomeEmail({
          firstName: data.firstName.trim(),
          email: normalizedEmail,
          phone: data.phone.trim(),
          appUrl: this.appUrl,
          source: 'admin-created',
          memberId: member.id,
        }),
      );

      return { profileId: profile.id, userId: supabaseUserId, role: data.role, member };
    } catch (dbError) {
      // Best-effort rollback so we don't leave an orphan Supabase user
      this.logger.error(
        `DB create failed after Supabase user creation — rolling back ${normalizedEmail}`,
        dbError as Error,
      );
      await this.supabaseAdmin.getClient().auth.admin.deleteUser(supabaseUserId).catch((err) => {
        this.logger.error(`Failed to roll back Supabase user ${supabaseUserId}: ${(err as Error).message}`);
      });
      throw dbError;
    }
  }
}
