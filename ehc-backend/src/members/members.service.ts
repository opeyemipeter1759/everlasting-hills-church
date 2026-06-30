import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';
import { MemberStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { canActOnRole } from '../users/role-hierarchy';
import { NotificationEvents } from '../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../notifications/member-welcome-email';
import { buildAccountDeactivationEmail } from '../notifications/templates/account-deactivation.email';

/** Days a member has to reverse a self-deactivation before data may be removed. */
const DEACTIVATION_REVERSAL_DAYS = 14;

export interface DirectoryQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  role?: string;
  status?: string;
  gender?: string;
  unit?: string;
  hasUnit?: string;
  joinedFrom?: string;
  joinedTo?: string;
  birthMonth?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface UpdateMemberInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string;
}

export interface BulkMemberOpInput {
  ids: string[];
  op: 'status' | 'addTag' | 'removeTag';
  value: string;
}

const DIRECTORY_INCLUDE = {
  Profile: { select: { id: true, userId: true, role: true } },
  EngagementScore: { select: { score: true } },
  _count: { select: { AttendanceRecord: true } },
  UnitMember: { include: { Unit: { select: { id: true, name: true } } } },
  CareAsMember: {
    where: { status: 'ACTIVE' as const },
    include: { Leader: { select: { id: true, firstName: true, lastName: true } } },
  },
} satisfies Prisma.MemberInclude;

type DirectoryRow = Prisma.MemberGetPayload<{ include: typeof DIRECTORY_INCLUDE }>;

/** Normalize a free-text visitor gender ("Male"/"f"/"FEMALE") to MALE|FEMALE|null. */
export function normalizeGender(raw?: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim().toUpperCase();
  if (v === 'MALE' || v === 'M') return 'MALE';
  if (v === 'FEMALE' || v === 'F') return 'FEMALE';
  return null;
}

/** Safely parse a visitor's free-text birthday string to a Date, or null. */
export function parseBirthday(raw?: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    '';
  if (!url || !key) throw new Error('Missing Supabase admin credentials');
  return createClient(url, key);
}

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
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

    const supabase = createAdminClient();
    let userId: string;
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: visitor.email,
        password: visitor.phone,
        email_confirm: true,
        user_metadata: { needs_password_change: true },
      } as any);

    if (authError) {
      // The visitor's email is already in Supabase Auth (e.g. a prior convert attempt
      // got past Supabase but failed before we wrote the Profile). Reuse that auth user
      // instead of asking the admin to clean up by hand — this makes the action idempotent.
      const isDuplicate = /already.*registered|already.*exists/i.test(
        authError.message,
      );
      if (!isDuplicate) {
        throw new InternalServerErrorException(
          `Could not create auth account: ${authError.message}`,
        );
      }
      const { data: list, error: listError } =
        await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
      if (listError) {
        throw new InternalServerErrorException(
          `Auth user exists but could not be looked up: ${listError.message}`,
        );
      }
      const found = list.users.find(
        (u) => u.email?.toLowerCase() === visitor.email!.toLowerCase(),
      );
      if (!found) {
        throw new InternalServerErrorException(
          'Auth user reported as duplicate but could not be located',
        );
      }
      // Re-link an orphan auth user: refresh password to the visitor's phone so the
      // admin's intent ("their initial password is their phone") holds.
      await supabase.auth.admin.updateUserById(found.id, {
        password: visitor.phone,
        email_confirm: true,
      });
      userId = found.id;
      // If a Profile already exists for this user, the visitor was effectively converted
      // before — bail out with a clear 409 so the admin knows.
      const orphanProfile = await this.prisma.profile.findUnique({
        where: { userId },
      });
      if (orphanProfile) {
        throw new ConflictException(
          'This person already has an account. Their Member record may have been removed — restore it instead of creating a new one.',
        );
      }
    } else {
      userId = authData.user.id;
    }

    const profile = await this.prisma.profile.create({
      data: {
        id: randomUUID(),
        userId,
        tenantId: this.tenantId,
        role: 'MEMBER',
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

  /** Find-or-create a Household by name within the tenant. Caches within an import run. */
  private async resolveHousehold(
    name: string | undefined,
    cache: Map<string, string>,
  ): Promise<string | null> {
    const trimmed = name?.trim();
    if (!trimmed) return null;
    const key = trimmed.toLowerCase();
    if (cache.has(key)) return cache.get(key)!;

    const existing = await this.prisma.household.findFirst({
      where: { tenantId: this.tenantId, name: trimmed },
      select: { id: true },
    });
    const id =
      existing?.id ??
      (
        await this.prisma.household.create({
          data: { id: randomUUID(), tenantId: this.tenantId, name: trimmed },
          select: { id: true },
        })
      ).id;
    cache.set(key, id);
    return id;
  }

  /**
   * Bulk-import members from parsed CSV rows. Each row provisions a full account
   * (Supabase auth user with phone as the initial password, Profile, Member),
   * mirroring single-visitor conversion. Rows whose email already has a member
   * are skipped. Per-row outcomes are returned so the admin sees exactly what
   * happened. Welcome emails are opt-in to avoid surprise blasts.
   */
  async bulkImport(
    rows: import('./dto/bulk-import.dto').ImportRowDto[],
    sendWelcome = false,
  ) {
    const supabase = createAdminClient();
    const householdCache = new Map<string, string>();
    const results: { email: string; status: 'created' | 'skipped' | 'error'; reason?: string }[] =
      [];
    let created = 0;

    for (const row of rows) {
      const email = row.email.trim().toLowerCase();
      const phone = row.phone.trim();
      try {
        const existing = await this.prisma.member.findFirst({
          where: { tenantId: this.tenantId, email },
          select: { id: true },
        });
        if (existing) {
          results.push({ email, status: 'skipped', reason: 'member already exists' });
          continue;
        }

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: phone,
          email_confirm: true,
          user_metadata: { needs_password_change: true },
        } as any);
        if (authError || !authData?.user) {
          const dup = /already.*registered|already.*exists/i.test(authError?.message ?? '');
          results.push({
            email,
            status: dup ? 'skipped' : 'error',
            reason: dup ? 'auth account already exists' : authError?.message ?? 'auth error',
          });
          continue;
        }

        const householdId = await this.resolveHousehold(row.household, householdCache);

        const profile = await this.prisma.profile.create({
          data: {
            id: randomUUID(),
            userId: authData.user.id,
            tenantId: this.tenantId,
            role: 'MEMBER',
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
        await this.prisma.member.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            profileId: profile.id,
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            email,
            phone,
            tags: row.tags ?? [],
            householdId,
          },
        });

        if (sendWelcome) {
          this.events.emit(
            NotificationEvents.SendEmail,
            buildMemberWelcomeEmail({
              firstName: row.firstName.trim(),
              email,
              phone,
              appUrl: this.appUrl,
              source: 'admin-created',
            }),
          );
        }

        created += 1;
        results.push({ email, status: 'created' });
      } catch (err) {
        results.push({ email, status: 'error', reason: (err as Error).message });
      }
    }

    const skipped = results.filter((r) => r.status === 'skipped').length;
    const errors = results.filter((r) => r.status === 'error').length;
    this.logger.log(`Bulk import: ${created} created, ${skipped} skipped, ${errors} errors`);
    return { created, skipped, errors, results };
  }

  /** Replace a member's tags. */
  async setTags(memberId: string, tags: string[]) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Member not found');
    const normalized = Array.from(
      new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
    );
    return this.prisma.member.update({
      where: { id: memberId },
      data: { tags: normalized },
      select: { id: true, tags: true },
    });
  }

  /**
   * Resolve the signed-in user's Member row from their Supabase userId.
   *
   * Self-healing: if a Profile exists but no Member row is attached, we create
   * one on the fly using the email from the JWT. This handles "orphan" accounts
   * (e.g. a SUPER_ADMIN seeded before the Member-row code path existed, or a
   * user whose Member row was deleted but whose Profile + auth user survived).
   *
   * Throws only when the Profile itself is missing — that genuinely needs an
   * admin to set the role.
   */
  private async getMyMember(userId: string, fallbackEmail?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true, tenantId: true, Member: { select: { id: true } } },
    });
    if (!profile) {
      throw new NotFoundException(
        'Your account has no profile yet. Contact an admin.',
      );
    }
    if (profile.Member) {
      return { profileId: profile.id, memberId: profile.Member.id };
    }

    // Auto-provision a minimal Member row. The user can edit names/phone/bio
    // from /dashboard/settings; we just need a row so subsequent updates work.
    const member = await this.prisma.member.create({
      data: {
        id: randomUUID(),
        tenantId: profile.tenantId,
        profileId: profile.id,
        firstName: 'New',
        lastName: 'Member',
        email: fallbackEmail ?? null,
      },
      select: { id: true },
    });
    this.logger.log(
      `Auto-provisioned Member ${member.id} for orphan profile ${profile.id} (${fallbackEmail ?? 'no email'})`,
    );
    return { profileId: profile.id, memberId: member.id };
  }

  async updateMyProfile(
    userId: string,
    data: import('./dto/update-my-profile.dto').UpdateMyProfileDto,
    fallbackEmail?: string,
  ) {
    const { memberId } = await this.getMyMember(userId, fallbackEmail);
    return this.prisma.member.update({
      where: { id: memberId },
      data: {
        ...(data.firstName !== undefined && {
          firstName: data.firstName.trim(),
        }),
        ...(data.lastName !== undefined && {
          lastName: data.lastName == null ? '' : data.lastName.trim(),
        }),
        ...(data.phone !== undefined && {
          phone:
            data.phone == null || data.phone === '' ? null : data.phone.trim(),
        }),
        ...(data.bio !== undefined && {
          bio: data.bio == null || data.bio === '' ? null : data.bio.trim(),
        }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        bio: true,
        photoUrl: true,
      },
    });
  }

  /**
   * Upload a profile photo to Cloudflare R2 and stamp the public URL on the Member row.
   * Mirrors the sermon-audio upload pattern in sermons.controller.ts so we stay consistent
   * about how blob storage is wired (one place to swap providers later if needed).
   */
  async setMyAvatar(
    userId: string,
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
    fallbackEmail?: string,
  ) {
    const { memberId } = await this.getMyMember(userId, fallbackEmail);

    const maxBytes = 1 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException('Photo must be under 1 MB');
    }
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Photo must be PNG, JPG, or JPEG');
    }

    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY
    ) {
      throw new InternalServerErrorException(
        'Photo storage is not configured on this server. Add R2_* env vars.',
      );
    }

    const ext = (file.originalname || '').split('.').pop() ?? 'jpg';
    const key = `avatars/${memberId}-${Date.now()}.${ext.toLowerCase()}`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
      const endpoint =
        process.env.R2_ENDPOINT ??
        `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      const bucket =
        process.env.R2_BUCKET ??
        process.env.R2_BUCKET_NAME ??
        process.env.R2_ACCOUNT_ID;
      const client = new S3Client({
        endpoint,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new InternalServerErrorException(`Avatar upload failed: ${msg}`);
    }

    const publicBase = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
    const photoUrl = publicBase ? `${publicBase}/${key}` : key;

    await this.prisma.member.update({
      where: { id: memberId },
      data: { photoUrl },
    });
    return { photoUrl };
  }

  async clearMyAvatar(userId: string, fallbackEmail?: string) {
    const { memberId } = await this.getMyMember(userId, fallbackEmail);
    await this.prisma.member.update({
      where: { id: memberId },
      data: { photoUrl: null },
    });
    return { success: true };
  }

  async getAllMembers(opts?: { search?: string; status?: string }) {
    const where: any = { tenantId: this.tenantId };
    if (opts?.status) where.status = opts.status;
    if (opts?.search) {
      where.OR = [
        { firstName: { contains: opts.search, mode: 'insensitive' } },
        { lastName: { contains: opts.search, mode: 'insensitive' } },
        { email: { contains: opts.search, mode: 'insensitive' } },
        { phone: { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.member.findMany({
      where,
      orderBy: [{ joinedAt: 'desc' }],
      include: { _count: { select: { AttendanceRecord: true } } },
    });
  }

  // ── Unified People directory (paginated / filtered / sorted) ─────────────────

  /**
   * Powers the merged People console. Returns a paginated, filtered, sorted slice
   * of members joined with their role (Profile), units, engagement, attendance
   * count and care-assignment summary — plus tenant-wide counts for the stats
   * strip and role chips. Shaped as { data, meta } like AttendanceService.listAttendance.
   */
  async getDirectory(q: DirectoryQuery) {
    const page = Math.max(1, Number(q.page ?? 1) || 1);
    const limit = Math.min(200, Math.max(1, Number(q.limit ?? 50) || 50));

    const where = await this.buildDirectoryWhere(q);

    const orderBy = this.directoryOrderBy(q.sortBy, q.sortOrder);

    const [rows, total, counts] = await Promise.all([
      this.prisma.member.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: this.directoryInclude(),
      }),
      this.prisma.member.count({ where }),
      this.directoryCounts(),
    ]);

    return {
      data: rows.map((r) => this.toPersonRow(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        counts,
      },
    };
  }

  private directoryInclude() {
    return DIRECTORY_INCLUDE;
  }

  private async buildDirectoryWhere(q: DirectoryQuery): Promise<Prisma.MemberWhereInput> {
    const where: Prisma.MemberWhereInput = { tenantId: this.tenantId };

    if (q.search) {
      const s = q.search.trim();
      where.OR = [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
      ];
    }
    if (q.status) where.status = q.status as MemberStatus;
    if (q.gender) where.gender = q.gender.toUpperCase();
    if (q.role) where.Profile = { is: { role: q.role as Role } };
    if (q.unit) where.UnitMember = { some: { unitId: q.unit } };
    if (q.hasUnit === 'true') where.UnitMember = { some: {} };
    if (q.hasUnit === 'false') where.UnitMember = { none: {} };

    if (q.joinedFrom || q.joinedTo) {
      where.joinedAt = {};
      if (q.joinedFrom) where.joinedAt.gte = new Date(q.joinedFrom);
      if (q.joinedTo) where.joinedAt.lte = new Date(`${q.joinedTo}T23:59:59.999Z`);
    }

    // Birth month needs MONTH() extraction Prisma can't express in a filter —
    // resolve matching ids with a raw query, then constrain by id.
    if (q.birthMonth) {
      const month = Number(q.birthMonth);
      if (month >= 1 && month <= 12) {
        const matches = await this.prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM "Member"
          WHERE "tenantId" = ${this.tenantId}
            AND "dateOfBirth" IS NOT NULL
            AND EXTRACT(MONTH FROM "dateOfBirth") = ${month}
        `;
        where.id = { in: matches.map((m) => m.id) };
      }
    }

    return where;
  }

  private directoryOrderBy(
    sortBy?: string,
    sortOrder?: string,
  ): Prisma.MemberOrderByWithRelationInput {
    const dir = sortOrder === 'asc' ? 'asc' : 'desc';
    switch (sortBy) {
      case 'name':
        return { firstName: dir };
      case 'status':
        return { status: dir };
      case 'role':
        return { Profile: { role: dir } };
      case 'joinedAt':
      default:
        return { joinedAt: dir };
    }
  }

  /** Tenant-wide counts for the stats strip + role chips (unfiltered). */
  private async directoryCounts() {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [byRoleRaw, active, withUnit, thisMonth, total] = await Promise.all([
      this.prisma.profile.groupBy({
        by: ['role'],
        where: { tenantId: this.tenantId, Member: { is: {} } },
        _count: { role: true },
      }),
      this.prisma.member.count({ where: { tenantId: this.tenantId, status: 'ACTIVE' } }),
      this.prisma.member.count({
        where: { tenantId: this.tenantId, UnitMember: { some: {} } },
      }),
      this.prisma.member.count({
        where: { tenantId: this.tenantId, joinedAt: { gte: monthStart } },
      }),
      this.prisma.member.count({ where: { tenantId: this.tenantId } }),
    ]);

    const byRole = Object.fromEntries(byRoleRaw.map((g) => [g.role, g._count.role]));
    return { total, active, withUnit, thisMonth, byRole };
  }

  private toPersonRow(r: DirectoryRow) {
    return {
      id: r.id,
      profileId: r.Profile?.id ?? null,
      userId: r.Profile?.userId ?? null,
      firstName: r.firstName,
      lastName: r.lastName,
      name: `${r.firstName} ${r.lastName}`.trim(),
      email: r.email,
      phone: r.phone,
      gender: r.gender,
      photoUrl: r.photoUrl,
      role: r.Profile?.role ?? 'MEMBER',
      status: r.status,
      tags: r.tags ?? [],
      dateOfBirth: r.dateOfBirth ? r.dateOfBirth.toISOString() : null,
      address: r.address,
      joinedAt: r.joinedAt.toISOString(),
      attendanceCount: r._count.AttendanceRecord,
      engagementScore: r.EngagementScore?.score ?? 0,
      units: r.UnitMember.map((um) => ({
        id: um.Unit.id,
        name: um.Unit.name,
        isLead: um.isLead,
        isAssistant: um.isAssistant,
      })),
      shepherdedBy: r.CareAsMember.map((c) => ({
        assignmentId: c.id,
        leaderId: c.leaderId,
        leaderName: `${c.Leader.firstName} ${c.Leader.lastName}`.trim(),
      })),
    };
  }

  /** Excel export of the directory honoring the same filters (no pagination). */
  async exportDirectory(q: DirectoryQuery): Promise<Buffer> {
    const where = await this.buildDirectoryWhere(q);
    const rows = await this.prisma.member.findMany({
      where,
      orderBy: this.directoryOrderBy(q.sortBy, q.sortOrder),
      include: this.directoryInclude(),
      take: 20_000,
    });
    const people = rows.map((r) => this.toPersonRow(r));

    const headers = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Role',
      'Status', 'Units', 'Tags', 'Birthday', 'Address', 'Joined', 'Shepherded By',
    ];
    const body = people.map((p) => [
      p.firstName,
      p.lastName,
      p.email ?? '',
      p.phone ?? '',
      p.gender ?? '',
      p.role,
      p.status,
      p.units.map((u) => u.name).join('; '),
      p.tags.join('; '),
      p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
      p.address ?? '',
      p.joinedAt.slice(0, 10),
      p.shepherdedBy.map((s) => s.leaderName).join('; '),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
    ws['!cols'] = headers.map((h, ci) => ({
      wch: Math.max(h.length, ...body.map((r) => String(r[ci] ?? '').length)) + 2,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'People');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  /** Admin edit of a member's core fields. */
  async updateMemberDetails(id: string, dto: UpdateMemberInput) {
    const member = await this.prisma.member.findFirst({
      where: { id, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    const data: Prisma.MemberUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase() || null;
    if (dto.address !== undefined) data.address = dto.address.trim() || null;
    if (dto.gender !== undefined) {
      const g = (dto.gender ?? '').toUpperCase();
      data.gender = g === 'MALE' || g === 'FEMALE' ? g : null;
    }
    if (dto.dateOfBirth !== undefined) {
      data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    }

    return this.prisma.member.update({ where: { id }, data });
  }

  /** Bulk status / tag operations on a set of member ids. */
  async bulkMemberOp(input: BulkMemberOpInput) {
    const ids = input.ids ?? [];
    if (ids.length === 0) return { updated: 0 };

    if (input.op === 'status') {
      const status = (input.value ?? '').toUpperCase();
      if (!['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DECEASED'].includes(status)) {
        throw new BadRequestException('Invalid status');
      }
      const res = await this.prisma.member.updateMany({
        where: { id: { in: ids }, tenantId: this.tenantId },
        data: { status: status as MemberStatus },
      });
      return { updated: res.count };
    }

    if (input.op === 'addTag' || input.op === 'removeTag') {
      const tag = (input.value ?? '').trim().toLowerCase();
      if (!tag) throw new BadRequestException('Tag required');
      const members = await this.prisma.member.findMany({
        where: { id: { in: ids }, tenantId: this.tenantId },
        select: { id: true, tags: true },
      });
      await Promise.all(
        members.map((m) => {
          const next =
            input.op === 'addTag'
              ? Array.from(new Set([...m.tags, tag]))
              : m.tags.filter((t) => t !== tag);
          return this.prisma.member.update({ where: { id: m.id }, data: { tags: next } });
        }),
      );
      return { updated: members.length };
    }

    throw new BadRequestException('Unknown bulk operation');
  }

  /**
   * Member-initiated account deactivation. Marks the account INACTIVE and stamps
   * the request time (start of the reversal window), then sends a confirmation
   * email explaining what happens and how to reverse it.
   */
  async requestDeactivation(userId: string, fallbackEmail?: string) {
    const { memberId } = await this.getMyMember(userId, fallbackEmail);
    const member = await this.prisma.member.update({
      where: { id: memberId },
      data: { status: 'INACTIVE', deactivationRequestedAt: new Date() },
      select: { id: true, firstName: true, email: true },
    });

    if (member.email) {
      this.events.emit(
        NotificationEvents.SendEmail,
        buildAccountDeactivationEmail({
          email: member.email,
          firstName: member.firstName,
          reversalDays: DEACTIVATION_REVERSAL_DAYS,
          appUrl: this.appUrl,
        }),
      );
    }

    return {
      success: true,
      status: 'INACTIVE',
      reversalDays: DEACTIVATION_REVERSAL_DAYS,
    };
  }

  /** Reverse a self-deactivation — reactivates the account and clears the request stamp. */
  async reactivateMe(userId: string, fallbackEmail?: string) {
    const { memberId } = await this.getMyMember(userId, fallbackEmail);
    await this.prisma.member.update({
      where: { id: memberId },
      data: { status: 'ACTIVE', deactivationRequestedAt: null },
    });
    return { success: true, status: 'ACTIVE' };
  }

  async getMemberById(memberId: string) {
    return this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        Profile: { select: { role: true } },
        EngagementScore: true,
        AttendanceRecord: {
          include: { Service: true },
          orderBy: { Service: { scheduledAt: 'desc' } },
          take: 20,
        },
        PastorNote: { orderBy: { createdAt: 'desc' } },
        FollowUpTask: { orderBy: { createdAt: 'desc' } },
        UnitMember: { include: { Unit: true } },
        CareAsMember: {
          where: { status: 'ACTIVE' },
          include: { Leader: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
        },
        CareAsLeader: {
          where: { status: 'ACTIVE' },
          include: { Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
        },
      },
    });
  }

  async updateMemberStatus(memberId: string, status: string) {
    return this.prisma.member.update({
      where: { id: memberId },
      data: { status } as any,
    });
  }
  async deleteMember(actor: AuthUser, memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        tenantId: true,
        firstName: true,
        lastName: true,
        email: true,
        Profile: { select: { id: true, userId: true, role: true } },
      },
    });
    if (!member || member.tenantId !== this.tenantId) {
      throw new NotFoundException('Member not found');
    }

    const targetRole = member.Profile?.role ?? 'MEMBER';
    if (!canActOnRole(actor.role as any, targetRole as any)) {
      throw new ForbiddenException(
        `Your role (${actor.role ?? 'none'}) cannot delete a ${targetRole}.`,
      );
    }

    const profileId = member.Profile?.id;
    const supabaseUserId = member.Profile?.userId;

    await this.prisma.$transaction(async (tx) => {
      // Children that reference Member.id (schema declares no onDelete cascades, so
      // we delete them explicitly). Keep this list in sync with members of the Member
      // model in schema.prisma.
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

      if (profileId) {
        await tx.roleAssignment.deleteMany({ where: { profileId } });
        await tx.profile.delete({ where: { id: profileId } });
      }
    });

    if (supabaseUserId) {
      try {
        const supabase = createAdminClient();
        const { error } = await supabase.auth.admin.deleteUser(supabaseUserId);
        if (error) {
          this.logger.warn(
            `Member ${memberId} removed from DB but Supabase user ${supabaseUserId} could not be deleted: ${error.message}`,
          );
        }
      } catch (err) {
        this.logger.warn(
          `Member ${memberId} removed but Supabase admin client failed: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(
      `[${actor.email}] deleted member ${member.firstName} ${member.lastName} (${member.email ?? 'no email'})`,
    );

    return { success: true, deletedId: memberId };
  }

  async getUpcomingBirthdays(daysAhead = 7) {
    const members = await this.prisma.member.findMany({
      where: { tenantId: this.tenantId, dateOfBirth: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        photoUrl: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return members
      .filter((m) => {
        if (!m.dateOfBirth) return false;
        const dob = new Date(m.dateOfBirth as any);
        const thisYear = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate(),
        );
        const diff = Math.ceil(
          (thisYear.getTime() - today.getTime()) / 86_400_000,
        );
        return diff >= 0 && diff <= daysAhead;
      })
      .map((m) => {
        const dob = new Date(m.dateOfBirth as any);
        const thisYear = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate(),
        );
        const daysUntil = Math.ceil(
          (thisYear.getTime() - today.getTime()) / 86_400_000,
        );
        return {
          ...m,
          dateOfBirth: (m.dateOfBirth as Date).toISOString(),
          daysUntil,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }

  async getTodayBirthdays() {
    return this.getUpcomingBirthdays(0);
  }

  async getAbsentMembers(missedSundays = 3) {
    const sundays = await this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { scheduledAt: 'desc' },
      take: missedSundays,
    });
    if (sundays.length < missedSundays) return [];

    const sundayIds = sundays.map((s) => s.id);
    const oldestSunday = sundays[sundays.length - 1].scheduledAt;

    const allActive = await this.prisma.member.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'ACTIVE',
        joinedAt: { lte: oldestSunday },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        photoUrl: true,
        AttendanceRecord: {
          where: { serviceId: { in: sundayIds } },
          select: { serviceId: true },
        },
      },
    });

    return (allActive as Array<any>)
      .filter((m) => (m.AttendanceRecord ?? []).length === 0)
      .map(({ AttendanceRecord: _, ...m }) => m);
  }

  async addPastorNote(memberId: string, content: string) {
    return this.prisma.pastorNote.create({
      data: { id: randomUUID(), tenantId: this.tenantId, memberId, content },
    });
  }

  async deletePastorNote(noteId: string) {
    return this.prisma.pastorNote.delete({ where: { id: noteId } });
  }

  async addFollowUpTask(memberId: string, title: string, dueDate?: string) {
    return this.prisma.followUpTask.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        memberId,
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
  }

  async toggleFollowUpTask(taskId: string, done: boolean) {
    return this.prisma.followUpTask.update({
      where: { id: taskId },
      data: { done, completedAt: done ? new Date() : null },
    });
  }

  async deleteFollowUpTask(taskId: string) {
    return this.prisma.followUpTask.delete({ where: { id: taskId } });
  }

  /** GET /members/at-risk — three risk categories */
  async getMembersAtRisk() {
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [members, totalServices, presentThisMonth, recentPresent] =
      await Promise.all([
        this.prisma.member.findMany({
          where: { tenantId: this.tenantId, status: 'ACTIVE' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            phone: true,
            joinedAt: true,
          },
        }),
        this.prisma.service.count({ where: { tenantId: this.tenantId } }),
        this.prisma.attendanceRecord.groupBy({
          by: ['memberId'],
          where: {
            tenantId: this.tenantId,
            present: true,
            Service: { scheduledAt: { gte: monthStart } },
          },
        }),
        this.prisma.attendanceRecord.groupBy({
          by: ['memberId'],
          where: {
            tenantId: this.tenantId,
            present: true,
            Service: { scheduledAt: { gte: fourWeeksAgo } },
          },
        }),
      ]);

    const presentThisMonthSet = new Set(
      presentThisMonth.map((r) => r.memberId),
    );
    const recentPresentSet = new Set(recentPresent.map((r) => r.memberId));

    const allTimePresent = await this.prisma.attendanceRecord.groupBy({
      by: ['memberId'],
      where: { tenantId: this.tenantId, present: true },
      _count: { _all: true },
    });
    const presentCountMap = new Map(
      allTimePresent.map((r) => [r.memberId, r._count._all]),
    );

    const neverAttended = members
      .filter(
        (m) =>
          !presentCountMap.has(m.id) && new Date(m.joinedAt) < fourWeeksAgo,
      )
      .map((m) => ({
        userId: m.id,
        userName: `${m.firstName} ${m.lastName}`,
        photoUrl: m.photoUrl ?? null,
        phone: m.phone ?? null,
        joinedAt: m.joinedAt.toISOString().slice(0, 10),
      }));

    const absentConsecutiveWeeks = members
      .filter((m) => presentCountMap.has(m.id) && !recentPresentSet.has(m.id))
      .map((m) => ({
        userId: m.id,
        userName: `${m.firstName} ${m.lastName}`,
        photoUrl: m.photoUrl ?? null,
        phone: m.phone ?? null,
        consecutiveAbsences: Math.ceil(
          (Date.now() - new Date(m.joinedAt).getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        ),
        lastSeen: null,
      }));

    const belowFiftyPercent = members
      .filter((m) => {
        const count = presentCountMap.get(m.id) ?? 0;
        return totalServices > 0 && count / totalServices < 0.5 && count > 0;
      })
      .map((m) => {
        const presentCount = presentCountMap.get(m.id) ?? 0;
        return {
          userId: m.id,
          userName: `${m.firstName} ${m.lastName}`,
          photoUrl: m.photoUrl ?? null,
          phone: m.phone ?? null,
          presentCount,
          totalCount: totalServices,
          rate: Math.round((presentCount / totalServices) * 100) / 100,
        };
      });

    return { absentConsecutiveWeeks, neverAttended, belowFiftyPercent };
  }
}
