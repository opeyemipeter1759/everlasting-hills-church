import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Role } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { NotificationEvents } from '../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../notifications/member-welcome-email';
import { canActOnRole, assignableRoles } from './role-hierarchy';
import { EffectiveRolesService } from '../auth/effective-roles.service';
import type { CreateUserDto, UpdateUserDto, UpdateUserRoleDto } from './dto/user.dto';

/** Roles stored as explicit grants (everything else is derived from assignments).
 * ADMIN_HEAD is grantable here for a church-wide appointment (independent of
 * heading any specific department — that's the separate DepartmentHead scope,
 * which additionally derives ADMIN_HEAD for that person once assigned to a
 * department). ADMIN is legacy — merged into ADMIN_HEAD (same level) — kept
 * only so existing grants still work. HOD is deliberately NOT grantable here:
 * it's only ever assigned scoped to a specific department, via
 * DepartmentsService.assignHod (POST /departments/:id/hods). */
const GRANTED_ROLES: Role[] = [Role.PASTOR, Role.ADMIN, Role.ADMIN_HEAD, Role.SUPER_ADMIN];

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
    private readonly effectiveRoles: EffectiveRolesService,
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
  /** The target's highest effective role (grants + assignments), for hierarchy checks. */
  private async targetPrimaryRole(profileId: string): Promise<Role> {
    return (await this.effectiveRoles.getEffectiveRoles(profileId)).primaryRole;
  }

  /** Grant a global role. History-preserving; idempotent on the active (user, role). */
  async grantRole(actor: AuthUser, profileId: string, role: Role) {
    if (!GRANTED_ROLES.includes(role)) {
      throw new BadRequestException(`${role} is a derived role; assign it via a unit or department, not a grant`);
    }
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, tenantId: true },
    });
    if (!target || target.tenantId !== this.tenantId) throw new NotFoundException('User not found');
    this.assertCanActOn(actor, role);
    this.assertCanActOn(actor, await this.targetPrimaryRole(profileId));

    const existing = await this.prisma.roleGrant.findFirst({
      where: { userId: profileId, role, endedAt: null },
      select: { id: true },
    });
    if (!existing) {
      await this.prisma.roleGrant.create({
        data: { id: randomUUID(), tenantId: this.tenantId, userId: profileId, role, grantedById: actor.profileId ?? null },
      });
      await this.writeAudit(actor, 'GRANT_ROLE', profileId, { role });
    }
    return { granted: role };
  }

  /** End an active grant (history-preserving). Revoking ADMIN_HEAD also ends a
   * legacy ADMIN grant if present (same merged role, different underlying row). */
  async revokeGrant(actor: AuthUser, profileId: string, role: Role) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, tenantId: true },
    });
    if (!target || target.tenantId !== this.tenantId) throw new NotFoundException('User not found');
    this.assertCanActOn(actor, role);
    this.assertCanActOn(actor, await this.targetPrimaryRole(profileId));

    const roleValues = role === Role.ADMIN_HEAD ? [Role.ADMIN_HEAD, Role.ADMIN] : [role];
    await this.prisma.roleGrant.updateMany({
      where: { userId: profileId, role: { in: roleValues }, endedAt: null },
      data: { endedAt: new Date() },
    });
    await this.writeAudit(actor, 'REVOKE_ROLE', profileId, { role });
    return { revoked: role };
  }

  /** Assign Head Usher — global, unscoped (unlike ADMIN_HEAD/HOD/UNIT_LEAD, no
   * department or unit target), so it's additive like a grant even though it's
   * backed by HeadUsherAssignment rather than RoleGrant. History-preserving. */
  async assignHeadUsher(actor: AuthUser, profileId: string) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, tenantId: true },
    });
    if (!target || target.tenantId !== this.tenantId) throw new NotFoundException('User not found');
    this.assertCanActOn(actor, Role.HEAD_USHER);
    this.assertCanActOn(actor, await this.targetPrimaryRole(profileId));

    const existing = await this.prisma.headUsherAssignment.findFirst({
      where: { userId: profileId, endedAt: null },
      select: { id: true },
    });
    if (!existing) {
      await this.prisma.headUsherAssignment.create({
        data: { id: randomUUID(), tenantId: this.tenantId, userId: profileId, assignedById: actor.profileId ?? null },
      });
      await this.writeAudit(actor, 'ASSIGN_HEAD_USHER', profileId, { role: Role.HEAD_USHER });
    }
    return { assigned: Role.HEAD_USHER };
  }

  async removeHeadUsher(actor: AuthUser, profileId: string) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, tenantId: true },
    });
    if (!target || target.tenantId !== this.tenantId) throw new NotFoundException('User not found');
    this.assertCanActOn(actor, Role.HEAD_USHER);
    this.assertCanActOn(actor, await this.targetPrimaryRole(profileId));

    await this.prisma.headUsherAssignment.updateMany({
      where: { userId: profileId, endedAt: null },
      data: { endedAt: new Date() },
    });
    await this.writeAudit(actor, 'REMOVE_HEAD_USHER', profileId, { role: Role.HEAD_USHER });
    return { removed: Role.HEAD_USHER };
  }

  private async writeAudit(actor: AuthUser, action: string, entityId: string, after: Prisma.InputJsonValue) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: randomUUID(), tenantId: this.tenantId, actorId: actor.userId,
          action, entity: 'RoleGrant', entityId, after,
        },
      });
    } catch (err) {
      this.logger.error(`Audit write failed (${action}): ${(err as Error).message}`);
    }
  }

  /** Exposed via GET /users/assignable-roles for frontend dropdown filtering. */
  assignableRolesFor(actor: AuthUser): Role[] {
    return assignableRoles(actor.role);
  }

  /** Returns every role with its display label, level, and count.
   *  ADMIN merged into ADMIN_HEAD (same level) — one combined row, counting the
   *  distinct union of legacy ADMIN grants, ADMIN_HEAD grants, and active
   *  DepartmentHead rows, so no one is double-counted across the two paths.
   *  Visitors are counted from the Visitor table (form submissions) that haven't
   *  converted to a Member yet — once convertedAt is set, that person is a
   *  Member (and counts there instead), not still a Visitor.
   *  All other roles are counted from the Profile table.
   */
  async getAllRoles() {
    // Counts come from grants + active assignments (the new source of truth), not
    // the legacy column. MEMBER is the universal base = every profile.
    const t = this.tenantId;
    const [totalProfiles, grantRows, unitLeads, deptHeads, deptHods, ushers, visitorCount] = await Promise.all([
      this.prisma.profile.count({ where: { tenantId: t } }),
      this.prisma.roleGrant.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true, role: true } }),
      this.prisma.unitLeadAssignment.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.departmentHead.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.departmentHod.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.headUsherAssignment.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.visitor.count({ where: { tenantId: t, convertedAt: null } }),
    ]);

    const distinctGrantCount = (role: Role) =>
      new Set(grantRows.filter((g) => g.role === role).map((g) => g.userId)).size;
    const adminHeadUserIds = new Set<string>([
      ...grantRows.filter((g) => g.role === Role.ADMIN || g.role === Role.ADMIN_HEAD).map((g) => g.userId),
      ...deptHeads.map((d) => d.userId),
    ]);
    const countMap: Record<string, number> = {
      [Role.SUPER_ADMIN]: distinctGrantCount(Role.SUPER_ADMIN),
      [Role.PASTOR]: distinctGrantCount(Role.PASTOR),
      [Role.ADMIN_HEAD]: adminHeadUserIds.size,
      [Role.HOD]: deptHods.length,
      [Role.HEAD_USHER]: ushers.length,
      [Role.UNIT_LEAD]: unitLeads.length,
      [Role.MEMBER]: totalProfiles,
    };

    return [
      { role: Role.SUPER_ADMIN, label: 'Super Admin', level: 8, count: countMap[Role.SUPER_ADMIN] ?? 0 },
      { role: Role.PASTOR,      label: 'Pastor',      level: 7, count: countMap[Role.PASTOR]      ?? 0 },
      { role: Role.ADMIN_HEAD,  label: 'Admin Head',  level: 6, count: countMap[Role.ADMIN_HEAD]  ?? 0 },
      { role: Role.HOD,         label: 'Head of Department', level: 4, count: countMap[Role.HOD]  ?? 0 },
      { role: Role.HEAD_USHER,  label: 'Head Usher',  level: 3, count: countMap[Role.HEAD_USHER]  ?? 0 },
      { role: Role.UNIT_LEAD,   label: 'Unit Leader', level: 2, count: countMap[Role.UNIT_LEAD]   ?? 0 },
      { role: Role.MEMBER,      label: 'Member',      level: 1, count: countMap[Role.MEMBER]       ?? 0 },
      { role: 'VISITOR',        label: 'Visitor',     level: 0, count: visitorCount },
    ];
  }

  /**
   * Returns all members grouped by role.
   * - SUPER_ADMIN / PASTOR / ADMIN / UNIT_LEAD / MEMBER come from Profile + Member.
   * - VISITOR comes from the Visitor table (form submissions — no auth account),
   *   excluding rows that have already converted to a Member (convertedAt set).
   * - UNIT_LEAD entries include which units they lead or assist.
   */
  async listByRole() {
    const [profiles, visitors] = await Promise.all([
      this.prisma.profile.findMany({
        where: { tenantId: this.tenantId },
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
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.visitor.findMany({
        where: { tenantId: this.tenantId, convertedAt: null },
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

    // Group each profile under its highest effective role (from grants + assignments).
    // ADMIN merges into ADMIN_HEAD (same level) — no separate ADMIN bucket.
    const effByProfile = await this.effectiveRoles.getEffectiveRolesBatch(profiles.map((p) => p.id));
    const grouped: Record<string, unknown[]> = {
      [Role.SUPER_ADMIN]: [],
      [Role.PASTOR]: [],
      [Role.ADMIN_HEAD]: [],
      [Role.HOD]: [],
      [Role.HEAD_USHER]: [],
      [Role.UNIT_LEAD]: [],
      [Role.MEMBER]: [],
      VISITOR: [],
    };

    for (const p of profiles) {
      const eff = effByProfile.get(p.id);
      const primaryRole = eff?.primaryRole ?? Role.MEMBER;
      const role = primaryRole === Role.ADMIN ? Role.ADMIN_HEAD : primaryRole;
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
            roles: eff?.roles ?? [Role.MEMBER],
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

      (grouped[role] ?? grouped[Role.MEMBER]).push({ profileId: p.id, userId: p.userId, role, roles: eff?.roles ?? [Role.MEMBER], member });
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

    const eff = await this.effectiveRoles.getEffectiveRolesBatch(profiles.map((p) => p.id));
    const mapped = profiles.map((p) => {
      const e = eff.get(p.id);
      return {
        profileId: p.id,
        userId: p.userId,
        role: e?.primaryRole ?? Role.MEMBER,
        roles: e?.roles ?? [Role.MEMBER],
        createdAt: p.createdAt,
        member: p.Member,
      };
    });
    // Role filter is by effective-role membership (grants + assignments). ADMIN_HEAD
    // also matches legacy ADMIN holders (merged, same level).
    if (!opts.role) return mapped;
    const wanted = opts.role === Role.ADMIN_HEAD ? [Role.ADMIN_HEAD, Role.ADMIN] : [opts.role];
    return mapped.filter((m) => wanted.some((r) => m.roles.includes(r)));
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
        },
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
          memberId: member.id,
        }),
      );

      return {
        profileId: profile.id,
        userId: supabaseUserId,
        role: data.role,
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

  // ── Bulk create (People console — one or many at once) ──────────────────────

  /**
   * Create several people in one submission. Each row goes through the same
   * single-create path (Supabase auth + Profile + Member + welcome email).
   * A failure on one row does NOT abort the batch — failures are collected and
   * returned so the UI can report exactly which rows need fixing.
   */
  async bulkCreate(actor: AuthUser, rows: CreateUserDto[]) {
    const created: Array<{ email: string; profileId: string }> = [];
    const failed: Array<{ email: string; reason: string }> = [];

    for (const row of rows) {
      try {
        const result = await this.create(actor, row);
        created.push({ email: row.email, profileId: result.profileId });
      } catch (err) {
        failed.push({
          email: row.email,
          reason: (err as Error)?.message ?? 'Unknown error',
        });
      }
    }

    return { created, failed, total: rows.length };
  }

  // ── Update role ────────────────────────────────────────────────────────────

  /**
   * Set a user's single granted role (backward-compatible with the People
   * dropdown). Ends all active grants, then applies the target: a granted role
   * becomes a RoleGrant, HEAD_USHER an assignment, MEMBER clears grants. Scoped
   * roles (UNIT_LEAD / ADMIN_HEAD) come from unit / department assignment flows.
   * For additive multi-role, use grantRole / revokeGrant instead.
   */
  async updateRole(actor: AuthUser, profileId: string, data: UpdateUserRoleDto) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, tenantId: true, userId: true, Member: { select: { email: true } } },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }

    // Actor must out-rank BOTH the current effective role and the new role.
    this.assertCanActOn(actor, await this.targetPrimaryRole(profileId));
    this.assertCanActOn(actor, data.role);

    await this.prisma.$transaction(async (tx) => {
      await tx.roleGrant.updateMany({ where: { userId: profileId, endedAt: null }, data: { endedAt: new Date() } });
      if (GRANTED_ROLES.includes(data.role)) {
        await tx.roleGrant.create({
          data: { id: randomUUID(), tenantId: this.tenantId, userId: profileId, role: data.role, grantedById: actor.profileId ?? null },
        });
      } else if (data.role === Role.HEAD_USHER) {
        const existing = await tx.headUsherAssignment.findFirst({ where: { userId: profileId, endedAt: null }, select: { id: true } });
        if (!existing) {
          await tx.headUsherAssignment.create({
            data: { id: randomUUID(), tenantId: this.tenantId, userId: profileId, assignedById: actor.profileId ?? null },
          });
        }
      }
    });

    await this.writeAudit(actor, 'SET_ROLE', profileId, { role: data.role });
    this.logger.log(`[${actor.email}] set ${target.Member?.email ?? target.userId} role -> ${data.role}`);
    return { profileId, role: data.role };
  }

  // ── Update profile (name/phone — doesn't touch role) ───────────────────────

  async updateProfile(actor: AuthUser, profileId: string, data: UpdateUserDto) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, tenantId: true, Member: { select: { id: true } } },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }
    this.assertCanActOn(actor, await this.targetPrimaryRole(profileId));

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
        tenantId: true,
        userId: true,
        Member: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }
    this.assertCanActOn(actor, await this.targetPrimaryRole(profileId));

    const memberId = target.Member?.id;

    await this.prisma.$transaction(async (tx) => {
      if (memberId) {
        // Keep this list in sync with relations on the Member model in schema.prisma.
        await tx.careAssignment.deleteMany({
          where: { OR: [{ memberId }, { leaderId: memberId }] },
        });
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
      select: { id: true, tenantId: true, Member: { select: { id: true } } },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }
    this.assertCanActOn(actor, await this.targetPrimaryRole(profileId));

    if (!target.Member) {
      throw new BadRequestException('User has no Member record');
    }

    return this.prisma.member.update({
      where: { id: target.Member.id },
      data: { status: 'INACTIVE' },
    });
  }
}
