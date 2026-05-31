import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../config/env.validation';
import { NotificationEvents } from '../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../notifications/member-welcome-email';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !key) throw new Error('Missing Supabase admin credentials');
  return createClient(url, key);
}

@Injectable()
export class MembersService {
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
    const visitor = await this.prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (!visitor.email) {
      throw new BadRequestException('Visitor has no email — email is required to create an account');
    }
    if (!visitor.phone) {
      throw new BadRequestException('Visitor has no phone number — phone is used as the initial password');
    }

    const existing = await this.prisma.member.findFirst({
      where: { tenantId: this.tenantId, email: visitor.email },
    });
    if (existing) {
      throw new ConflictException('A member account already exists for this email address');
    }

    const supabase = createAdminClient();
    let userId: string;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: visitor.email,
      password: visitor.phone,
      email_confirm: true,
      user_metadata: { needs_password_change: true },
    } as any);

    if (authError) {
      // The visitor's email is already in Supabase Auth (e.g. a prior convert attempt
      // got past Supabase but failed before we wrote the Profile). Reuse that auth user
      // instead of asking the admin to clean up by hand — this makes the action idempotent.
      const isDuplicate = /already.*registered|already.*exists/i.test(authError.message);
      if (!isDuplicate) {
        throw new InternalServerErrorException(
          `Could not create auth account: ${authError.message}`,
        );
      }
      const { data: list, error: listError } = await supabase.auth.admin.listUsers({
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
      const orphanProfile = await this.prisma.profile.findUnique({ where: { userId } });
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
        AttendanceRecord: { include: { Service: true }, orderBy: { Service: { scheduledAt: 'desc' } }, take: 20 },
        PastorNote: { orderBy: { createdAt: 'desc' } },
        FollowUpTask: { orderBy: { createdAt: 'desc' } },
        UnitMember: { include: { Unit: true } },
      },
    });
  }

  async updateMemberStatus(memberId: string, status: string) {
    return this.prisma.member.update({ where: { id: memberId }, data: { status } as any });
  }

  async getUpcomingBirthdays(daysAhead = 7) {
    const members = await this.prisma.member.findMany({
      where: { tenantId: this.tenantId, dateOfBirth: { not: null } },
      select: { id: true, firstName: true, lastName: true, email: true, dateOfBirth: true, photoUrl: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return members
      .filter((m) => {
        if (!m.dateOfBirth) return false;
        const dob = new Date(m.dateOfBirth as any);
        const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86_400_000);
        return diff >= 0 && diff <= daysAhead;
      })
      .map((m) => {
        const dob = new Date(m.dateOfBirth as any);
        const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        const daysUntil = Math.ceil((thisYear.getTime() - today.getTime()) / 86_400_000);
        return { ...m, dateOfBirth: (m.dateOfBirth as Date).toISOString(), daysUntil };
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
      where: { tenantId: this.tenantId, status: 'ACTIVE', joinedAt: { lte: oldestSunday } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        photoUrl: true,
        AttendanceRecord: { where: { serviceId: { in: sundayIds } }, select: { serviceId: true } },
      },
    });

    return (allActive as Array<any>)
      .filter((m) => (m.AttendanceRecord ?? []).length === 0)
      .map(({ AttendanceRecord: _, ...m }) => m);
  }

  async addPastorNote(memberId: string, content: string) {
    return this.prisma.pastorNote.create({ data: { id: randomUUID(), tenantId: this.tenantId, memberId, content } });
  }

  async deletePastorNote(noteId: string) {
    return this.prisma.pastorNote.delete({ where: { id: noteId } });
  }

  async addFollowUpTask(memberId: string, title: string, dueDate?: string) {
    return this.prisma.followUpTask.create({
      data: { id: randomUUID(), tenantId: this.tenantId, memberId, title, dueDate: dueDate ? new Date(dueDate) : null },
    });
  }

  async toggleFollowUpTask(taskId: string, done: boolean) {
    return this.prisma.followUpTask.update({ where: { id: taskId }, data: { done, completedAt: done ? new Date() : null } });
  }

  async deleteFollowUpTask(taskId: string) {
    return this.prisma.followUpTask.delete({ where: { id: taskId } });
  }
}
