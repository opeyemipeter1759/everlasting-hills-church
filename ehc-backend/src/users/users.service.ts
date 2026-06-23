import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { NotificationEvents } from '../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../notifications/member-welcome-email';
import { canActOnRole, assignableRoles } from './role-hierarchy';
import type { CreateUserDto, UpdateUserDto, UpdateUserRoleDto } from './dto/user.dto';

/**
 * Admin-only user management. Creates Supabase auth users + their Profile + Member rows
 * in a single coordinated flow. Hierarchical authorization enforced server-side — even if
 * the frontend forgets to filter the dropdown, the API will reject.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly supabaseUrl: string;
  private readonly supabaseServiceRoleKey: string | undefined;
  private supabaseClient: SupabaseClient | null = null;
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.supabaseUrl = config.get('SUPABASE_URL', { infer: true });
    this.supabaseServiceRoleKey = config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true }) as
      | string
      | undefined;
    if (!this.supabaseServiceRoleKey) {
      // Don't throw at boot — let createUser fail at call time with a clear message.
      // The app still boots; only the create-user path is unavailable.
      this.logger.warn(
        'SUPABASE_SERVICE_ROLE_KEY not set — POST /users will fail with 500 until configured',
      );
    }
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ??
      'http://localhost:3000';
  }

  /**
   * Lazy admin client. The Supabase SDK refuses to construct with an empty key, so
   * we delay creation until first use and throw a clear error.
   */
  private getSupabaseAdmin(): SupabaseClient {
    if (!this.supabaseServiceRoleKey) {
      throw new BadRequestException(
        'User management is not configured on this server. Set SUPABASE_SERVICE_ROLE_KEY.',
      );
    }
    if (!this.supabaseClient) {
      this.supabaseClient = createClient(this.supabaseUrl, this.supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this.supabaseClient;
  }

  // ── Authorization helpers ───────────────────────────────────────────────────

  private assertCanActOn(actor: AuthUser, targetRole: Role) {
    if (!canActOnRole(actor.role, targetRole)) {
      throw new ForbiddenException(
        `Your role (${actor.role ?? 'none'}) cannot manage a ${targetRole}.`,
      );
    }
  }

  /**
   * Mirror the app role into the Supabase user's app_metadata so it rides in the signed
   * JWT (the frontend middleware verifies it cryptographically). Best-effort: a failure
   * here doesn't fail the role change — the DB stays authoritative and the middleware
   * falls back to the hint cookie until the next token refresh.
   */
  private async syncRoleClaim(userId: string, role: Role) {
    try {
      const admin = this.getSupabaseAdmin();
      const { data: current } = await admin.auth.admin.getUserById(userId);
      const existing = (current?.user?.app_metadata as Record<string, unknown> | undefined) ?? {};
      await admin.auth.admin.updateUserById(userId, {
        app_metadata: { ...existing, role },
      });
    } catch (err) {
      this.logger.warn(
        `Could not sync role claim for ${userId}: ${(err as Error).message}`,
      );
    }
  }

  /** Exposed via GET /users/assignable-roles for frontend dropdown filtering. */
  assignableRolesFor(actor: AuthUser): Role[] {
    return assignableRoles(actor.role);
  }

  /** Returns every role with its display label, level, and count.
   *  Visitors are counted from the Visitor table (form submissions),
   *  all other roles are counted from the Profile table.
   */
  async getAllRoles() {
    const [profileCounts, visitorCount] = await Promise.all([
      this.prisma.profile.groupBy({
        by: ['role'],
        where: {
          tenantId: this.tenantId,
          role: { not: Role.VISITOR },
        },
        _count: { role: true },
      }),
      this.prisma.visitor.count({ where: { tenantId: this.tenantId } }),
    ]);

    const countMap = Object.fromEntries(profileCounts.map((c) => [c.role, c._count.role]));

    return [
      { role: Role.SUPER_ADMIN, label: 'Super Admin', level: 5, count: countMap[Role.SUPER_ADMIN] ?? 0 },
      { role: Role.PASTOR,      label: 'Pastor',      level: 4, count: countMap[Role.PASTOR]      ?? 0 },
      { role: Role.ADMIN,       label: 'Admin',       level: 3, count: countMap[Role.ADMIN]        ?? 0 },
      { role: Role.UNIT_LEAD,   label: 'Unit Leader', level: 2, count: countMap[Role.UNIT_LEAD]   ?? 0 },
      { role: Role.MEMBER,      label: 'Member',      level: 1, count: countMap[Role.MEMBER]       ?? 0 },
      { role: 'VISITOR',        label: 'Visitor',     level: 0, count: visitorCount },
    ];
  }

  /**
   * Returns all members grouped by role.
   * - SUPER_ADMIN / PASTOR / ADMIN / UNIT_LEAD / MEMBER come from Profile + Member.
   * - VISITOR comes from the Visitor table (form submissions — no auth account).
   * - UNIT_LEAD entries include which units they lead or assist.
   */
  async listByRole() {
    const [profiles, visitors] = await Promise.all([
      this.prisma.profile.findMany({
        where: {
          tenantId: this.tenantId,
          role: { not: Role.VISITOR },
        },
        include: {
          Member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              photoUrl: true,
              status: true,
              joinedAt: true,
              UnitMember: {
                where: { OR: [{ isLead: true }, { isAssistant: true }] },
                include: { Unit: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.visitor.findMany({
        where: { tenantId: this.tenantId },
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          submittedAt: true,
        },
      }),
    ]);

    const grouped: Record<string, unknown[]> = {
      [Role.SUPER_ADMIN]: [],
      [Role.PASTOR]: [],
      [Role.ADMIN]: [],
      [Role.UNIT_LEAD]: [],
      [Role.MEMBER]: [],
      VISITOR: [],
    };

    for (const p of profiles) {
      const role = p.role ?? Role.MEMBER;
      const member = p.Member
        ? {
            id: p.Member.id,
            firstName: p.Member.firstName,
            lastName: p.Member.lastName,
            email: p.Member.email,
            phone: p.Member.phone,
            photoUrl: p.Member.photoUrl,
            status: p.Member.status,
            joinedAt: p.Member.joinedAt,
            ...(role === Role.UNIT_LEAD && {
              units: p.Member.UnitMember.map((um) => ({
                unitId: um.Unit.id,
                unitName: um.Unit.name,
                isLead: um.isLead,
                isAssistant: um.isAssistant,
              })),
            }),
          }
        : null;

      grouped[role].push({ profileId: p.id, userId: p.userId, role, member });
    }

    grouped['VISITOR'] = visitors.map((v) => ({
      id: v.id,
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      phone: v.phone,
      submittedAt: v.submittedAt,
    }));

    return grouped;
  }

  // ── Read ────────────────────────────────────────────────────────────────────

  async list(opts: { search?: string; role?: Role } = {}) {
    const profiles = await this.prisma.profile.findMany({
      where: {
        tenantId: this.tenantId,
        ...(opts.role && { role: opts.role }),
        ...(opts.search && {
          Member: {
            OR: [
              { firstName: { contains: opts.search, mode: 'insensitive' } },
              { lastName: { contains: opts.search, mode: 'insensitive' } },
              { email: { contains: opts.search, mode: 'insensitive' } },
            ],
          },
        }),
      },
      include: {
        Member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            photoUrl: true,
            joinedAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return profiles.map((p) => ({
      profileId: p.id,
      userId: p.userId,
      role: p.role,
      createdAt: p.createdAt,
      member: p.Member,
    }));
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(actor: AuthUser, data: CreateUserDto) {
    this.assertCanActOn(actor, data.role);

    const normalizedEmail = data.email.toLowerCase().trim();

    // Reject if email already taken at the Member level (cheap check before hitting Supabase)
    const existing = await this.prisma.member.findFirst({
      where: { email: normalizedEmail, tenantId: this.tenantId },
    });
    if (existing) {
      throw new BadRequestException(
        `A user with email "${normalizedEmail}" already exists`,
      );
    }

    // 1) Create Supabase auth user — phone becomes initial password (church convention).
    // `needs_password_change` is read by the login handler so the UI can route the user
    // to /change-password on their very first sign-in.
    const { data: created, error } = await this.getSupabaseAdmin().auth.admin.createUser({
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
      throw new BadRequestException(
        `Could not create auth user: ${error?.message ?? 'unknown error'}`,
      );
    }

    const supabaseUserId = created.user.id;

    // 2) Profile + Member in one transaction — if either fails, roll back the auth user
    try {
      const profile = await this.prisma.profile.create({
        data: {
          id: randomUUID(),
          userId: supabaseUserId,
          tenantId: this.tenantId,
          role: data.role,
        },
      });
      const member = await this.prisma.member.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          profileId: profile.id,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: normalizedEmail,
          phone: data.phone.trim(),
        },
      });

      this.logger.log(
        `[${actor.email}] created ${data.role}: ${normalizedEmail}`,
      );

      // Fire-and-forget welcome email — sign-in link + the member features they get access to.
      this.events.emit(
        NotificationEvents.SendEmail,
        buildMemberWelcomeEmail({
          firstName: data.firstName.trim(),
          email: normalizedEmail,
          phone: data.phone.trim(),
          appUrl: this.appUrl,
          source: 'admin-created',
        }),
      );

      return {
        profileId: profile.id,
        userId: supabaseUserId,
        role: profile.role,
        member,
      };
    } catch (dbError) {
      // Best-effort rollback so we don't leave an orphan Supabase user
      this.logger.error(
        `DB create failed after Supabase user creation — rolling back ${normalizedEmail}`,
        dbError as Error,
      );
      await this.getSupabaseAdmin().auth.admin.deleteUser(supabaseUserId).catch((err) => {
        this.logger.error(
          `Failed to roll back Supabase user ${supabaseUserId}: ${(err as Error).message}`,
        );
      });
      throw dbError;
    }
  }

  // ── Update role ────────────────────────────────────────────────────────────

  async updateRole(actor: AuthUser, profileId: string, data: UpdateUserRoleDto) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, role: true, tenantId: true, userId: true, Member: { select: { email: true } } },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }

    // Actor must out-rank BOTH the current and the new role
    this.assertCanActOn(actor, target.role);
    this.assertCanActOn(actor, data.role);

    if (target.role === data.role) {
      return target; // no-op
    }

    const updated = await this.prisma.profile.update({
      where: { id: profileId },
      data: { role: data.role },
    });

    // Push the new role into the signed JWT claim (best-effort; DB is authoritative).
    await this.syncRoleClaim(target.userId, data.role);

    this.logger.log(
      `[${actor.email}] changed ${target.Member?.email ?? target.userId} role: ${target.role} → ${data.role}`,
    );

    return updated;
  }

  // ── Update profile (name/phone — doesn't touch role) ───────────────────────

  async updateProfile(actor: AuthUser, profileId: string, data: UpdateUserDto) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, role: true, tenantId: true, Member: { select: { id: true } } },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }
    this.assertCanActOn(actor, target.role);

    if (!target.Member) {
      throw new BadRequestException('User has no Member record to update');
    }

    return this.prisma.member.update({
      where: { id: target.Member.id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName.trim() }),
        ...(data.lastName !== undefined && { lastName: data.lastName.trim() }),
        ...(data.phone !== undefined && { phone: data.phone.trim() }),
      },
    });
  }

  // ── Delete (hard — removes Member + Profile + Supabase auth user) ─────────

  /**
   * Permanently delete a user. Mirrors MembersService.deleteMember:
   *   1. Authorize via role hierarchy (actor must out-rank target).
   *   2. Inside a transaction: remove every record that references the Member,
   *      then the Member, then RoleAssignments + Profile.
   *   3. Best-effort delete the Supabase auth user — failure here just leaves an
   *      orphan auth user (logged for manual cleanup) so the DB delete is not undone.
   *
   * Why hard delete: the admins reported that soft-deleted users still appeared in
   * Supabase Auth and could re-login if anyone flipped their status. "Delete" now
   * means "gone everywhere".
   */
  async deleteUser(actor: AuthUser, profileId: string) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        role: true,
        tenantId: true,
        userId: true,
        Member: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }
    this.assertCanActOn(actor, target.role);

    const memberId = target.Member?.id;

    await this.prisma.$transaction(async (tx) => {
      if (memberId) {
        // Keep this list in sync with relations on the Member model in schema.prisma.
        await tx.attendanceRecord.deleteMany({ where: { memberId } });
        await tx.discussionResponse.deleteMany({ where: { memberId } });
        await tx.engagementScore.deleteMany({ where: { memberId } });
        await tx.followUpTask.deleteMany({ where: { memberId } });
        await tx.listenProgress.deleteMany({ where: { memberId } });
        await tx.pastorNote.deleteMany({ where: { memberId } });
        await tx.pastoralAlert.deleteMany({ where: { memberId } });
        await tx.sermonBookmark.deleteMany({ where: { memberId } });
        await tx.sermonNote.deleteMany({ where: { memberId } });
        await tx.sermonReaction.deleteMany({ where: { memberId } });
        await tx.unitMember.deleteMany({ where: { memberId } });
        await tx.member.delete({ where: { id: memberId } });
      }
      await tx.roleAssignment.deleteMany({ where: { profileId } });
      await tx.profile.delete({ where: { id: profileId } });
    });

    try {
      const { error } = await this.getSupabaseAdmin().auth.admin.deleteUser(target.userId);
      if (error) {
        this.logger.warn(
          `User ${profileId} removed from DB but Supabase auth user ${target.userId} could not be deleted: ${error.message}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `User ${profileId} removed but Supabase admin client failed: ${(err as Error).message}`,
      );
    }

    const name = target.Member
      ? `${target.Member.firstName} ${target.Member.lastName}`.trim()
      : target.userId;
    this.logger.log(
      `[${actor.email}] permanently deleted user ${name} (${target.Member?.email ?? 'no email'})`,
    );

    return { success: true, deletedProfileId: profileId };
  }

  // ── Soft deactivate (kept for callers that explicitly want INACTIVE status) ──

  async deactivate(actor: AuthUser, profileId: string) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, role: true, tenantId: true, Member: { select: { id: true } } },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }
    this.assertCanActOn(actor, target.role);

    if (!target.Member) {
      throw new BadRequestException('User has no Member record');
    }

    return this.prisma.member.update({
      where: { id: target.Member.id },
      data: { status: 'INACTIVE' },
    });
  }
}
