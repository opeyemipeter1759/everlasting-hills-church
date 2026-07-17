import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import type { CreateAssignmentDto } from './dto/create-assignment.dto';

/**
 * Care / discipleship assignments: link members to a leader (also a member) for
 * follow-up. Backs the "Assign Members" flow in the People console.
 */
@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Assign members[] to leaderId. Idempotent per (member, leader); skips self-links. */
  async assign(actor: AuthUser, dto: CreateAssignmentDto) {
    const leader = await this.prisma.member.findFirst({
      where: { id: dto.leaderId, tenantId: this.tenantId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!leader) throw new NotFoundException('Leader not found');

    const memberIds = [...new Set(dto.memberIds)].filter((id) => id !== dto.leaderId);
    if (memberIds.length === 0) {
      throw new BadRequestException('No assignable members (cannot assign a leader to themselves)');
    }

    // Only assign members that actually exist in this tenant.
    const valid = await this.prisma.member.findMany({
      where: { id: { in: memberIds }, tenantId: this.tenantId },
      select: { id: true },
    });

    let created = 0;
    for (const m of valid) {
      const existing = await this.prisma.careAssignment.findUnique({
        where: {
          tenantId_memberId_leaderId: {
            tenantId: this.tenantId,
            memberId: m.id,
            leaderId: dto.leaderId,
          },
        },
        select: { id: true },
      });
      if (existing) continue;
      await this.prisma.careAssignment.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          memberId: m.id,
          leaderId: dto.leaderId,
          assignedById: actor.userId,
          note: dto.note?.trim() || null,
        },
      });
      created += 1;
    }

    this.logger.log(
      `[${actor.email}] assigned ${created} member(s) to ${leader.firstName} ${leader.lastName}`,
    );
    return { assigned: created, skipped: valid.length - created, leaderId: dto.leaderId };
  }

  /** List assignments, optionally filtered by leader or member. */
  async list(opts: { leaderId?: string; memberId?: string }) {
    const rows = await this.prisma.careAssignment.findMany({
      where: {
        tenantId: this.tenantId,
        ...(opts.leaderId ? { leaderId: opts.leaderId } : {}),
        ...(opts.memberId ? { memberId: opts.memberId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        Leader: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
      member: {
        id: r.Member.id,
        name: `${r.Member.firstName} ${r.Member.lastName}`.trim(),
        photoUrl: r.Member.photoUrl,
      },
      leader: {
        id: r.Leader.id,
        name: `${r.Leader.firstName} ${r.Leader.lastName}`.trim(),
        photoUrl: r.Leader.photoUrl,
      },
    }));
  }

  async remove(id: string) {
    const existing = await this.prisma.careAssignment.findFirst({
      where: { id, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Assignment not found');
    await this.prisma.careAssignment.delete({ where: { id } });
    return { success: true, id };
  }

  // ── Self-service (Unit Lead) ──────────────────────────────────────────────────
  // Backs the "my follow-ups" workspace: a leader's own shepherd list, scoped to
  // just the members assigned to them — never the org-wide view (that stays ADMIN+).

  /** The people a leader shepherds, each with their open follow-up tasks and a
   * lightweight last-attended signal (not the full at-risk algorithm, which stays
   * ADMIN+ only — just enough to badge "needs follow-up"). */
  async listMine(leaderId: string | null) {
    if (!leaderId) return [];

    const assignments = await this.prisma.careAssignment.findMany({
      where: { tenantId: this.tenantId, leaderId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true, phone: true } },
      },
    });
    if (assignments.length === 0) return [];

    const memberIds = assignments.map((a) => a.memberId);

    const [tasks, lastAttended] = await Promise.all([
      this.prisma.followUpTask.findMany({
        where: { tenantId: this.tenantId, memberId: { in: memberIds } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.attendanceRecord.groupBy({
        by: ['memberId'],
        where: { tenantId: this.tenantId, memberId: { in: memberIds }, present: true },
        _max: { checkedInAt: true },
      }),
    ]);

    const tasksByMember = new Map<string, typeof tasks>();
    for (const t of tasks) {
      tasksByMember.set(t.memberId, [...(tasksByMember.get(t.memberId) ?? []), t]);
    }
    const lastAttendedByMember = new Map(
      lastAttended.map((r) => [r.memberId, r._max.checkedInAt]),
    );

    const now = Date.now();
    return assignments.map((a) => {
      const lastAttendedAt = lastAttendedByMember.get(a.memberId) ?? null;
      const weeksSinceAttended = lastAttendedAt
        ? Math.floor((now - lastAttendedAt.getTime()) / (7 * 24 * 60 * 60 * 1000))
        : null;
      return {
        id: a.id,
        note: a.note,
        createdAt: a.createdAt.toISOString(),
        member: {
          id: a.Member.id,
          name: `${a.Member.firstName} ${a.Member.lastName}`.trim(),
          photoUrl: a.Member.photoUrl,
          phone: a.Member.phone,
        },
        lastAttendedAt: lastAttendedAt?.toISOString() ?? null,
        weeksSinceAttended,
        tasks: (tasksByMember.get(a.memberId) ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate?.toISOString() ?? null,
          done: t.done,
          completedAt: t.completedAt?.toISOString() ?? null,
        })),
      };
    });
  }

  /** Verifies `leaderId` actively shepherds `memberId` before letting them touch that
   * member's follow-up tasks — the ownership check for the self-service routes below. */
  private async assertShepherds(leaderId: string, memberId: string) {
    const assignment = await this.prisma.careAssignment.findUnique({
      where: {
        tenantId_memberId_leaderId: { tenantId: this.tenantId, memberId, leaderId },
      },
      select: { status: true },
    });
    if (!assignment || assignment.status !== 'ACTIVE') {
      throw new NotFoundException('You are not assigned to follow up with this person');
    }
  }

  async addFollowUpTaskAsLeader(leaderId: string, memberId: string, title: string, dueDate?: string) {
    await this.assertShepherds(leaderId, memberId);
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

  async toggleFollowUpTaskAsLeader(leaderId: string, taskId: string, done: boolean) {
    const task = await this.prisma.followUpTask.findFirst({
      where: { id: taskId, tenantId: this.tenantId },
      select: { memberId: true },
    });
    if (!task) throw new NotFoundException('Follow-up task not found');
    await this.assertShepherds(leaderId, task.memberId);
    return this.prisma.followUpTask.update({
      where: { id: taskId },
      data: { done, completedAt: done ? new Date() : null },
    });
  }
}
