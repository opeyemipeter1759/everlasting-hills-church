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
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { canActOnRole } from '../users/role-hierarchy';
import { NotificationEvents } from '../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../notifications/member-welcome-email';

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
        dateOfBirth: visitor.dateOfBirth ? new Date(visitor.dateOfBirth) : null,
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
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        }),
        ...(data.weddingAnniversary !== undefined && {
          weddingAnniversary: data.weddingAnniversary
            ? new Date(data.weddingAnniversary)
            : null,
        }),
        ...(data.instagram !== undefined && {
          instagram:
            data.instagram == null || data.instagram === ''
              ? null
              : data.instagram.trim(),
        }),
        ...(data.facebook !== undefined && {
          facebook:
            data.facebook == null || data.facebook === ''
              ? null
              : data.facebook.trim(),
        }),
        ...(data.twitter !== undefined && {
          twitter:
            data.twitter == null || data.twitter === ''
              ? null
              : data.twitter.trim(),
        }),
        ...(data.linkedin !== undefined && {
          linkedin:
            data.linkedin == null || data.linkedin === ''
              ? null
              : data.linkedin.trim(),
        }),
        ...(data.tiktok !== undefined && {
          tiktok:
            data.tiktok == null || data.tiktok === '' ? null : data.tiktok.trim(),
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
        gender: true,
        dateOfBirth: true,
        weddingAnniversary: true,
        instagram: true,
        facebook: true,
        twitter: true,
        linkedin: true,
        tiktok: true,
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

  async getMemberById(memberId: string) {
    return this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        AttendanceRecord: {
          include: { Service: true },
          orderBy: { Service: { scheduledAt: 'desc' } },
          take: 20,
        },
        PastorNote: { orderBy: { createdAt: 'desc' } },
        FollowUpTask: { orderBy: { createdAt: 'desc' } },
        UnitMember: { include: { Unit: true } },
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
