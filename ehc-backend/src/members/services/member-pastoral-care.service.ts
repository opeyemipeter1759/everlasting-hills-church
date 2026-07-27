import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

/** Pastor notes, absentee lookups, and follow-up task CRUD. */
@Injectable()
export class MemberPastoralCareService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
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

  /** GET /members/follow-ups — every open task org-wide, with who's assigned to shepherd
   * each member (if anyone). Backs the pastor's follow-ups oversight page. */
  async listOpenFollowUpTasks() {
    const tasks = await this.prisma.followUpTask.findMany({
      where: { tenantId: this.tenantId, done: false },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true, phone: true } },
      },
    });
    if (tasks.length === 0) return [];

    const memberIds = [...new Set(tasks.map((t) => t.memberId))];
    const assignments = await this.prisma.careAssignment.findMany({
      where: { tenantId: this.tenantId, memberId: { in: memberIds }, status: 'ACTIVE' },
      include: { Leader: { select: { firstName: true, lastName: true } } },
    });
    const leaderByMember = new Map(
      assignments.map((a) => [a.memberId, `${a.Leader.firstName} ${a.Leader.lastName}`.trim()]),
    );

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      member: {
        id: t.Member.id,
        name: `${t.Member.firstName} ${t.Member.lastName}`.trim(),
        photoUrl: t.Member.photoUrl,
        phone: t.Member.phone,
      },
      assignedLeaderName: leaderByMember.get(t.memberId) ?? null,
    }));
  }
}
