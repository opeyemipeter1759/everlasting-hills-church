import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../config/env.validation';

const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !key) throw new Error('Missing Supabase admin credentials');
  return createClient(url, key);
}

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async convertVisitorToMember(visitorId: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) throw new Error('Visitor not found');
    if (!visitor.email) throw new Error('Visitor has no email — email is required to create an account');
    if (!visitor.phone) throw new Error('Visitor has no phone number — phone is used as the initial password');

    const existing = await this.prisma.member.findFirst({ where: { tenantId: this.tenantId, email: visitor.email } });
    if (existing) throw new Error('A member account already exists for this email address');

    const supabase = createAdminClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: visitor.email,
      password: visitor.phone,
      email_confirm: true,
      user_metadata: { needs_password_change: true },
    } as any);
    if (authError) throw new Error(`Could not create auth account: ${authError.message}`);

    const userId = authData.user.id;

    const profile = await this.prisma.profile.create({ data: { userId, tenantId: this.tenantId, role: 'MEMBER' } as any });

    await this.prisma.roleAssignment.create({ data: { tenantId: this.tenantId, profileId: profile.id, role: 'MEMBER' } as any });

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

    // Welcome email if Resend configured
    if (process.env.RESEND_API_KEY) {
      try {
        // dynamically require to avoid hard dependency if not installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: `Everlasting Hills Church <${FROM}>`,
          to: visitor.email,
          subject: 'Welcome to Everlasting Hills Church — Your Account is Ready',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
              <div style="background:#87102C;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center">
                <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900;letter-spacing:-0.5px">Everlasting Hills Church</h1>
                <p style="color:#FFE8ED;margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px">Member Portal</p>
              </div>
              <h2 style="color:#111;font-size:22px;margin:0 0 8px">Welcome, ${visitor.firstName}! 🎉</h2>
              <p style="color:#555;margin:0 0 24px;line-height:1.6">Your member account at Everlasting Hills Church is ready. Here are your login details:</p>
              <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:20px;margin-bottom:24px">
                <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:700">Login Details</p>
                <p style="margin:0 0 6px;color:#111"><strong>Website:</strong> <a href="${APP_URL}/login" style="color:#87102C">${APP_URL}/login</a></p>
                <p style="margin:0 0 6px;color:#111"><strong>Email:</strong> ${visitor.email}</p>
                <p style="margin:0;color:#111"><strong>Temporary Password:</strong> Your phone number (${visitor.phone})</p>
              </div>
              <p style="color:#555;margin:0 0 24px;font-size:14px;line-height:1.6">You will be asked to set a new password on your first login. We recommend doing this immediately.</p>
              <a href="${APP_URL}/login" style="display:inline-block;background:#87102C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Login to your account →</a>
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0"/>
              <p style="color:#aaa;font-size:12px;margin:0">Everlasting Hills Church · Ibadan, Nigeria<br/>Raising men who flourish beyond limits.</p>
            </div>
          `,
        });
      } catch (err) {
        this.logger.error(`Welcome email failed: ${(err as Error).message ?? err}`);
      }
    }

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
