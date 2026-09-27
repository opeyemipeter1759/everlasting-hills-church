import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { InboxService } from '../../inbox/inbox.service';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildEvangelismTaskEmail } from '../../notifications/templates/evangelism-task.email';
import type { Env } from '../../config/env.validation';
import type {
  EvangelismTaskDto,
  EvangelismTaskNoteDto,
  ListEvangelismTasksQuery,
  UpdateEvangelismTaskDto,
} from '../dto/evangelism.dto';
import type { EvangelismViewer } from '../evangelism.types';
import { EvangelismAccessService } from './evangelism-access.service';

const TYPE_LABELS: Record<string, string> = {
  CALL: 'Call',
  VISIT: 'Visit',
  INVITE: 'Invite to church',
  PRAYER: 'Prayer',
  OTHER: 'Other',
};

const TASK_INCLUDE = {
  Assignees: { select: { memberId: true } },
  Notes: { orderBy: { createdAt: 'asc' } },
  Contact: { select: { id: true, name: true } },
} satisfies Prisma.EvangelismTaskInclude;

type TaskRow = Prisma.EvangelismTaskGetPayload<{ include: typeof TASK_INCLUDE }>;

/** Tasks a leader hands out to the team: call this person, visit that one. */
@Injectable()
export class EvangelismTasksService {
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: EvangelismAccessService,
    private readonly inbox: InboxService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) ?? 'https://www.everlastinghills.church').replace(/\/$/, '');
  }

  private get tenantId() {
    return this.access.tenant;
  }

  async list(viewer: EvangelismViewer, q: ListEvangelismTasksQuery) {
    const scope = q.scope ?? 'mine';
    if (scope === 'all' && !viewer.canLead) throw new ForbiddenException('Only leaders see every task.');
    const where: Prisma.EvangelismTaskWhereInput = { tenantId: this.tenantId };
    if (scope === 'mine') where.Assignees = { some: { memberId: viewer.memberId ?? '__nobody__' } };
    if (q.status) where.status = q.status;
    if (q.contactId) where.contactId = q.contactId;

    const rows = await this.prisma.evangelismTask.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
    });
    const mapped = await this.toDtos(rows);
    // Open work first, the most pressing at the top; finished tasks last.
    const rank = (t: (typeof mapped)[number]) => (t.status === 'DONE' ? 2 : t.overdue ? 0 : 1);
    return mapped.sort((a, b) => rank(a) - rank(b));
  }

  private async toDtos(rows: TaskRow[]) {
    const names = await this.access.names([
      ...rows.flatMap((t) => t.Assignees.map((a) => a.memberId)),
      ...rows.map((t) => t.createdById),
    ]);
    const now = new Date();
    return rows.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      type: t.type,
      priority: t.priority,
      status: t.status,
      dueAt: t.dueAt?.toISOString() ?? null,
      completedAt: t.completedAt?.toISOString() ?? null,
      overdue: t.status !== 'DONE' && !!t.dueAt && t.dueAt < now,
      contact: t.Contact,
      assignees: t.Assignees.map((a) => ({
        id: a.memberId,
        name: names.get(a.memberId)?.name ?? 'Former member',
        photoUrl: names.get(a.memberId)?.photoUrl ?? null,
      })),
      createdBy: t.createdById ? (names.get(t.createdById)?.name ?? null) : null,
      createdAt: t.createdAt.toISOString(),
      notes: t.Notes.map((n) => ({
        id: n.id,
        body: n.body,
        author: { id: n.authorMemberId, name: n.authorName },
        createdAt: n.createdAt.toISOString(),
      })),
    }));
  }

  private async one(id: string) {
    const row = await this.prisma.evangelismTask.findFirst({ where: { id, tenantId: this.tenantId }, include: TASK_INCLUDE });
    if (!row) throw new NotFoundException('Task not found');
    return row;
  }

  async create(viewer: EvangelismViewer, dto: EvangelismTaskDto) {
    const assigneeIds = await this.checkAssignees(viewer.unitId, dto.assigneeIds);
    if (assigneeIds.length === 0) throw new BadRequestException('Assign the task to at least one team member.');
    const contactId = await this.checkContact(dto.contactId);
    const now = new Date();
    const id = randomUUID();
    await this.prisma.evangelismTask.create({
      data: {
        id,
        tenantId: this.tenantId,
        title: dto.title,
        description: dto.description ?? null,
        contactId,
        type: dto.type,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        priority: dto.priority ?? 'MEDIUM',
        status: 'PENDING',
        createdById: viewer.memberId,
        updatedById: viewer.memberId,
        updatedAt: now,
        Assignees: { create: assigneeIds.map((memberId) => ({ id: randomUUID(), memberId })) },
      },
    });
    const task = await this.one(id);
    await this.notify(viewer, task, assigneeIds);
    return (await this.toDtos([task]))[0];
  }

  async update(viewer: EvangelismViewer, id: string, dto: UpdateEvangelismTaskDto) {
    const task = await this.one(id);
    const assigned = !!viewer.memberId && task.Assignees.some((a) => a.memberId === viewer.memberId);
    if (!viewer.canLead) {
      const onlyStatus = Object.keys(dto).every((k) => k === 'status');
      if (!assigned || !onlyStatus) throw new ForbiddenException('You can update the status of tasks given to you.');
    }

    const data: Prisma.EvangelismTaskUncheckedUpdateInput = { updatedById: viewer.memberId, updatedAt: new Date() };
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueAt !== undefined) data.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    if (dto.contactId !== undefined) data.contactId = await this.checkContact(dto.contactId);
    if (dto.status !== undefined) {
      data.status = dto.status;
      data.completedAt = dto.status === 'DONE' ? (task.completedAt ?? new Date()) : null;
    }

    let added: string[] = [];
    if (dto.assigneeIds !== undefined) {
      const next = await this.checkAssignees(viewer.unitId, dto.assigneeIds);
      if (next.length === 0) throw new BadRequestException('A task needs at least one person.');
      const before = new Set(task.Assignees.map((a) => a.memberId));
      added = next.filter((m) => !before.has(m));
      await this.prisma.$transaction([
        this.prisma.evangelismTaskAssignee.deleteMany({ where: { taskId: id, memberId: { notIn: next } } }),
        this.prisma.evangelismTaskAssignee.createMany({
          data: added.map((memberId) => ({ id: randomUUID(), taskId: id, memberId })),
          skipDuplicates: true,
        }),
      ]);
    }
    await this.prisma.evangelismTask.update({ where: { id }, data });
    const fresh = await this.one(id);
    if (added.length) await this.notify(viewer, fresh, added);
    return (await this.toDtos([fresh]))[0];
  }

  async addNote(viewer: EvangelismViewer, id: string, dto: EvangelismTaskNoteDto) {
    const task = await this.one(id);
    const assigned = !!viewer.memberId && task.Assignees.some((a) => a.memberId === viewer.memberId);
    if (!viewer.canLead && !assigned) throw new ForbiddenException('Only the people on this task can add notes.');
    await this.prisma.evangelismTaskNote.create({
      data: { id: randomUUID(), taskId: id, body: dto.body, authorMemberId: viewer.memberId, authorName: viewer.name },
    });
    return (await this.toDtos([await this.one(id)]))[0];
  }

  async remove(id: string) {
    await this.one(id);
    await this.prisma.evangelismTask.delete({ where: { id } });
    return { id, deleted: true };
  }

  /** Only people on the Evangelism unit can be given its tasks. */
  private async checkAssignees(unitId: string, ids: string[]): Promise<string[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    const seats = await this.prisma.unitMember.findMany({
      where: { unitId, memberId: { in: unique } },
      select: { memberId: true },
    });
    if (seats.length !== unique.length) throw new BadRequestException('Tasks can only go to people on the Evangelism Team.');
    return unique;
  }

  private async checkContact(contactId?: string | null): Promise<string | null> {
    if (!contactId) return null;
    const contact = await this.prisma.evangelismContact.findFirst({
      where: { id: contactId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!contact) throw new BadRequestException('That contact no longer exists.');
    return contact.id;
  }

  /** In-app bell and an email to each new assignee (not to whoever assigned it to themselves). */
  private async notify(viewer: EvangelismViewer, task: TaskRow, memberIds: string[]) {
    const recipients = memberIds.filter((m) => m !== viewer.memberId);
    if (recipients.length === 0) return;
    const members = await this.prisma.member.findMany({
      where: { id: { in: recipients } },
      select: { profileId: true, email: true, firstName: true },
    });
    const link = `/dashboard/growth-outreach/${viewer.unitId}?tab=tasks&task=${task.id}`;
    const due = task.dueAt
      ? task.dueAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' })
      : null;

    await this.inbox.createMany(
      members.map((m) => ({
        tenantId: this.tenantId,
        profileId: m.profileId,
        title: `New Evangelism task: ${task.title}`,
        body: [TYPE_LABELS[task.type] ?? task.type, task.Contact?.name, due ? `due ${due}` : null].filter(Boolean).join(' · '),
        type: 'evangelism-task',
        link,
      })),
    );
    for (const m of members) {
      if (!m.email) continue;
      this.events.emit(
        NotificationEvents.SendEmail,
        buildEvangelismTaskEmail({
          to: m.email,
          firstName: m.firstName,
          title: task.title,
          typeLabel: TYPE_LABELS[task.type] ?? task.type,
          dueLabel: due,
          contactName: task.Contact?.name ?? null,
          assignedBy: viewer.name,
          url: `${this.appUrl}${link}`,
        }),
      );
    }
  }
}
