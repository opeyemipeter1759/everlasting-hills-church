import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnitTaskReportOutcome, UnitTaskReportStatus, UnitTaskStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { InboxService } from '../../inbox/inbox.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { CreateUnitTaskReportDto, ReviewUnitTaskReportDto, UpdateUnitTaskReportDto } from '../dto/unit-task-report.dto';
import { UnitsMembershipService } from './units-membership.service';

const PERSON_SELECT = { id: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } } as const;
type PersonLike = { id: string; Member: { firstName: string; lastName: string; photoUrl: string | null } | null } | null;

const REPORT_INCLUDE = {
  Author: { select: PERSON_SELECT },
  ReviewedBy: { select: PERSON_SELECT },
} as const;

/** Maps a report's outcome onto the task's own status — a "completed" report
 * closes the task, a "still working" one moves it off To-do. Never regresses
 * a task that's already further along. */
const OUTCOME_TO_STATUS: Record<UnitTaskReportOutcome, UnitTaskStatus | null> = {
  COMPLETED: UnitTaskStatus.DONE,
  IN_PROGRESS: UnitTaskStatus.IN_PROGRESS,
  BLOCKED: null,
};

/**
 * Task reports: the assignee's formal write-up on a task, reviewed by the
 * unit's lead/assistant. Separate from the comment thread, which is open
 * discussion for the whole unit.
 *
 * Who can do what:
 *   - write:  the task's assignee (or any unit member, for a whole-unit task)
 *   - edit:   the author, until the lead has acknowledged it
 *   - delete: the author while it's still merely submitted; a lead any time
 *   - review: lead/assistant of the unit, or ADMIN+
 *   - read:   leads see every report on the task; a member sees their own
 */
@Injectable()
export class UnitTaskReportsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: UnitsMembershipService,
    private readonly inbox: InboxService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private personLabel(p: PersonLike) {
    if (!p) return null;
    const m = p.Member;
    return { profileId: p.id, name: m ? `${m.firstName} ${m.lastName}`.trim() : 'Unknown', photoUrl: m?.photoUrl ?? null };
  }

  private toDto(r: {
    id: string;
    taskId: string;
    outcome: UnitTaskReportOutcome;
    summary: string;
    challenges: string | null;
    nextSteps: string | null;
    status: UnitTaskReportStatus;
    reviewNote: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    Author: PersonLike;
    ReviewedBy: PersonLike;
  }) {
    return {
      id: r.id,
      taskId: r.taskId,
      outcome: r.outcome,
      summary: r.summary,
      challenges: r.challenges,
      nextSteps: r.nextSteps,
      status: r.status,
      reviewNote: r.reviewNote,
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      reviewedBy: this.personLabel(r.ReviewedBy),
      author: this.personLabel(r.Author),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  private async loadTask(unitId: string, taskId: string) {
    const task = await this.prisma.unitTask.findFirst({
      where: { id: taskId, unitId, tenantId: this.tenantId },
      select: { id: true, title: true, unitId: true, assignedToId: true, status: true, Unit: { select: { name: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  /** True for lead/assistant of the unit or ADMIN+; false (not throw) otherwise. */
  private async canManage(actor: AuthUser, unitId: string): Promise<boolean> {
    try {
      await this.membership.assertCanManageUnit(actor, unitId);
      return true;
    } catch {
      return false;
    }
  }

  private async assertCanReport(actor: AuthUser, task: { assignedToId: string | null }) {
    if (!actor.memberId || !actor.profileId) throw new ForbiddenException('No member record on your account');
    if (task.assignedToId && task.assignedToId !== actor.memberId) {
      throw new ForbiddenException('Only the person this task is assigned to can report on it');
    }
  }

  private async loadReport(taskId: string, reportId: string) {
    const report = await this.prisma.unitTaskReport.findFirst({
      where: { id: reportId, taskId, tenantId: this.tenantId },
      include: REPORT_INCLUDE,
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  /** Profile ids of the unit's lead + assistants, minus the person triggering the event. */
  private async leadershipProfileIds(unitId: string, exceptProfileId: string | null) {
    const rows = await this.prisma.unitMember.findMany({
      where: { unitId, tenantId: this.tenantId, OR: [{ isLead: true }, { isAssistant: true }] },
      select: { Member: { select: { profileId: true } } },
    });
    return [...new Set(rows.map((r) => r.Member.profileId).filter((id): id is string => !!id && id !== exceptProfileId))];
  }

  async list(actor: AuthUser, unitId: string, taskId: string) {
    await this.membership.assertIsUnitMember(actor, unitId);
    await this.loadTask(unitId, taskId);

    const manages = await this.canManage(actor, unitId);
    const rows = await this.prisma.unitTaskReport.findMany({
      where: {
        taskId,
        tenantId: this.tenantId,
        ...(manages ? {} : { authorId: actor.profileId ?? '' }),
      },
      orderBy: { createdAt: 'desc' },
      include: REPORT_INCLUDE,
    });
    return rows.map((r) => this.toDto(r));
  }

  async create(actor: AuthUser, unitId: string, taskId: string, dto: CreateUnitTaskReportDto) {
    await this.membership.assertIsUnitMember(actor, unitId);
    const task = await this.loadTask(unitId, taskId);
    await this.assertCanReport(actor, task);

    const nextStatus = OUTCOME_TO_STATUS[dto.outcome];
    const shouldAdvance =
      nextStatus !== null && task.status !== UnitTaskStatus.DONE && task.status !== nextStatus;

    const [report] = await this.prisma.$transaction([
      this.prisma.unitTaskReport.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          taskId,
          authorId: actor.profileId!,
          outcome: dto.outcome,
          summary: dto.summary.trim(),
          challenges: dto.challenges?.trim() || null,
          nextSteps: dto.nextSteps?.trim() || null,
        },
        include: REPORT_INCLUDE,
      }),
      ...(shouldAdvance
        ? [
            this.prisma.unitTask.update({
              where: { id: taskId },
              data: {
                status: nextStatus!,
                completedAt: nextStatus === UnitTaskStatus.DONE ? new Date() : null,
              },
            }),
          ]
        : []),
    ]);

    const authorName = this.personLabel(report.Author)?.name ?? 'A member';
    const recipients = await this.leadershipProfileIds(unitId, actor.profileId);
    await this.inbox.createMany(
      recipients.map((profileId) => ({
        tenantId: this.tenantId,
        profileId,
        title: `Task report: ${task.title}`,
        body: `${authorName} reported "${OUTCOME_LABEL[dto.outcome]}" on ${task.Unit.name}'s task.`,
        type: 'task-report',
        link: `/dashboard/unit-lead/${unitId}/tasks`,
      })),
    );

    return this.toDto(report);
  }

  async update(actor: AuthUser, unitId: string, taskId: string, reportId: string, dto: UpdateUnitTaskReportDto) {
    await this.membership.assertIsUnitMember(actor, unitId);
    await this.loadTask(unitId, taskId);
    const report = await this.loadReport(taskId, reportId);

    if (report.authorId !== actor.profileId) throw new ForbiddenException('You can only edit your own report');
    if (report.status === UnitTaskReportStatus.ACKNOWLEDGED) {
      throw new BadRequestException('This report has already been acknowledged and can no longer be edited');
    }
    if (Object.keys(dto).length === 0) throw new BadRequestException('Nothing to update');

    const updated = await this.prisma.unitTaskReport.update({
      where: { id: reportId },
      data: {
        ...(dto.outcome !== undefined && { outcome: dto.outcome }),
        ...(dto.summary !== undefined && { summary: dto.summary.trim() }),
        ...(dto.challenges !== undefined && { challenges: dto.challenges.trim() || null }),
        ...(dto.nextSteps !== undefined && { nextSteps: dto.nextSteps.trim() || null }),
        // A revised report goes back into the lead's queue.
        ...(report.status === UnitTaskReportStatus.NEEDS_REVISION && { status: UnitTaskReportStatus.SUBMITTED }),
      },
      include: REPORT_INCLUDE,
    });
    return this.toDto(updated);
  }

  async review(actor: AuthUser, unitId: string, taskId: string, reportId: string, dto: ReviewUnitTaskReportDto) {
    await this.membership.assertCanManageUnit(actor, unitId);
    const task = await this.loadTask(unitId, taskId);
    const report = await this.loadReport(taskId, reportId);

    if (dto.status === UnitTaskReportStatus.NEEDS_REVISION && !dto.note?.trim()) {
      throw new BadRequestException('Tell the author what needs to change when sending a report back');
    }

    const updated = await this.prisma.unitTaskReport.update({
      where: { id: reportId },
      data: {
        status: dto.status,
        reviewNote: dto.note?.trim() || null,
        reviewedById: actor.profileId,
        reviewedAt: new Date(),
      },
      include: REPORT_INCLUDE,
    });

    if (report.authorId !== actor.profileId) {
      await this.inbox.createMany([
        {
          tenantId: this.tenantId,
          profileId: report.authorId,
          title:
            dto.status === UnitTaskReportStatus.ACKNOWLEDGED
              ? `Your report on "${task.title}" was acknowledged`
              : `Your report on "${task.title}" needs a revision`,
          body: dto.note?.trim() || null,
          type: 'task-report',
          link: `/dashboard/unit/${unitId}`,
        },
      ]);
    }

    return this.toDto(updated);
  }

  async delete(actor: AuthUser, unitId: string, taskId: string, reportId: string) {
    await this.membership.assertIsUnitMember(actor, unitId);
    await this.loadTask(unitId, taskId);
    const report = await this.loadReport(taskId, reportId);

    const manages = await this.canManage(actor, unitId);
    const isAuthor = report.authorId === actor.profileId;
    if (!manages && !isAuthor) throw new ForbiddenException('You can only delete your own report');
    if (isAuthor && !manages && report.status !== UnitTaskReportStatus.SUBMITTED) {
      throw new BadRequestException('A report the lead has already reviewed can no longer be withdrawn');
    }

    await this.prisma.unitTaskReport.delete({ where: { id: reportId } });
    return { id: reportId, deleted: true };
  }
}

const OUTCOME_LABEL: Record<UnitTaskReportOutcome, string> = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In progress',
  BLOCKED: 'Blocked',
};
