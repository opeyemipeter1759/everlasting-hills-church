import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  EvangelismContactDto,
  ListEvangelismContactsQuery,
  LogEvangelismActionDto,
  ReviewEvangelismContactDto,
  UpdateEvangelismContactDto,
} from '../dto/evangelism.dto';
import type { EvangelismViewer } from '../evangelism.types';
import { normaliseNigerianPhone } from '../evangelism-phone.util';
import { windowEnd, windowState } from '../evangelism-window.util';
import { startOfLagosMonth } from '../evangelism-dates.util';
import { EvangelismAccessService } from './evangelism-access.service';

const DAY = 24 * 60 * 60 * 1000;

const LIST_SELECT = {
  id: true,
  name: true,
  phone: true,
  address: true,
  savedStatus: true,
  isStudent: true,
  school: true,
  level: true,
  workerMemberId: true,
  workerName: true,
  outreachId: true,
  contactDate: true,
  nextAction: true,
  consent: true,
  status: true,
  callBackAt: true,
  lastActionAt: true,
  windowEndsAt: true,
  reviewOutcome: true,
  reviewedAt: true,
  closedAt: true,
  invitedAt: true,
  attendedAt: true,
  source: true,
  createdAt: true,
  Outreach: { select: { id: true, name: true } },
  _count: { select: { Activities: true } },
} satisfies Prisma.EvangelismContactSelect;

type ListRow = Prisma.EvangelismContactGetPayload<{ select: typeof LIST_SELECT }>;

/** Who did it, for the history: a signed-in team member, or the public form. */
export interface Actor {
  memberId: string | null;
  name: string;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'name',
  phone: 'phone',
  address: 'address',
  savedStatus: 'saved status',
  isStudent: 'student',
  school: 'school',
  level: 'level',
  discussion: 'discussion',
  workerMemberId: 'worker',
  workerName: 'worker',
  outreachId: 'outreach',
  contactDate: 'date of contact',
  nextAction: 'next action',
  consent: 'consent',
};

/**
 * People the Evangelism Team has preached to, and their 30-day follow-up.
 * Every change lands on the contact's history with who made it.
 */
@Injectable()
export class EvangelismContactsService {
  private readonly logger = new Logger(EvangelismContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: EvangelismAccessService,
  ) {}

  private get tenantId() {
    return this.access.tenant;
  }

  // ── Recording ──────────────────────────────────────────────────────────────

  async create(unitId: string, dto: EvangelismContactDto, actor: Actor, source: 'FORM' | 'DASHBOARD') {
    const phone = normaliseNigerianPhone(dto.phone);
    if (!phone) throw new BadRequestException('Enter a Nigerian phone number, like 0803 123 4567 or +234 803 123 4567.');
    if (dto.isStudent && !dto.school) throw new BadRequestException('Add the school name for a student.');

    const worker = await this.resolveWorker(unitId, dto.workerMemberId, dto.workerName);
    const outreachId = await this.resolveOutreach(dto.outreachId);
    const contactDate = this.contactDate(dto.contactDate);
    const now = new Date();
    const id = randomUUID();

    await this.prisma.$transaction([
      this.prisma.evangelismContact.create({
        data: {
          id,
          tenantId: this.tenantId,
          name: dto.name,
          phone,
          address: dto.address,
          savedStatus: dto.savedStatus,
          isStudent: dto.isStudent,
          school: dto.isStudent ? (dto.school ?? null) : null,
          level: dto.isStudent ? (dto.level ?? null) : null,
          discussion: dto.discussion ?? null,
          workerMemberId: worker.memberId,
          workerName: worker.name,
          outreachId,
          contactDate,
          nextAction: dto.nextAction ?? null,
          consent: dto.consent,
          status: 'NEW',
          callBackAt: null,
          windowEndsAt: windowEnd(contactDate),
          source,
          createdById: actor.memberId,
          updatedById: actor.memberId,
          updatedAt: now,
        },
      }),
      this.prisma.evangelismActivity.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          contactId: id,
          kind: 'CREATED',
          note: source === 'FORM' ? `Recorded on the outreach form by ${worker.name}` : `Added on the dashboard`,
          happenedAt: now,
          actorMemberId: source === 'FORM' ? worker.memberId : actor.memberId,
          actorName: source === 'FORM' ? worker.name : actor.name,
        },
      }),
    ]);
    return { id };
  }

  private async resolveWorker(unitId: string, memberId?: string, typedName?: string): Promise<Actor> {
    if (memberId) {
      const seat = await this.prisma.unitMember.findFirst({
        where: { unitId, memberId },
        select: { Member: { select: { id: true, firstName: true, lastName: true } } },
      });
      if (seat) return { memberId: seat.Member.id, name: `${seat.Member.firstName} ${seat.Member.lastName}`.trim() };
      // A leader may credit someone who has since left the team.
      const member = await this.prisma.member.findFirst({
        where: { id: memberId, tenantId: this.tenantId },
        select: { id: true, firstName: true, lastName: true },
      });
      if (member) return { memberId: member.id, name: `${member.firstName} ${member.lastName}`.trim() };
    }
    if (typedName) return { memberId: null, name: typedName };
    throw new BadRequestException('Choose the worker who preached to them.');
  }

  private async resolveOutreach(outreachId?: string | null): Promise<string | null> {
    if (!outreachId) return null;
    const outreach = await this.prisma.evangelismOutreach.findFirst({
      where: { id: outreachId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!outreach) throw new BadRequestException('That outreach no longer exists.');
    return outreach.id;
  }

  /** Today (now) unless a past date is given; never in the future. */
  private contactDate(input?: string): Date {
    const now = new Date();
    if (!input) return now;
    const date = new Date(input.length === 10 ? `${input}T12:00:00+01:00` : input);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date of contact.');
    if (date.getTime() > now.getTime() + DAY) throw new BadRequestException('The date of contact cannot be in the future.');
    if (date.toISOString().slice(0, 10) === now.toISOString().slice(0, 10)) return now;
    return date;
  }

  // ── Reading ────────────────────────────────────────────────────────────────

  async list(viewer: EvangelismViewer, q: ListEvangelismContactsQuery) {
    const where: Prisma.EvangelismContactWhereInput = { tenantId: this.tenantId };
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search.replace(/\s/g, '') } },
        { address: { contains: q.search, mode: 'insensitive' } },
        { workerName: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    if (q.workerMemberId) where.workerMemberId = q.workerMemberId;
    if (q.outreachId) where.outreachId = q.outreachId === 'none' ? null : q.outreachId;
    if (q.savedStatus) where.savedStatus = q.savedStatus;
    if (q.isStudent !== undefined) where.isStudent = q.isStudent;
    if (q.status) where.status = q.status;
    if (q.from || q.to) {
      where.contactDate = {
        ...(q.from ? { gte: new Date(`${q.from.slice(0, 10)}T00:00:00+01:00`) } : {}),
        ...(q.to ? { lte: new Date(`${q.to.slice(0, 10)}T23:59:59.999+01:00`) } : {}),
      };
    }
    if (q.mine) where.workerMemberId = viewer.memberId ?? '__nobody__';

    const rows = await this.prisma.evangelismContact.findMany({
      where,
      select: LIST_SELECT,
      orderBy: { contactDate: 'desc' },
    });
    const now = new Date();
    let mapped = await this.toRows(rows, now);
    if (q.flag) mapped = mapped.filter((r) => r.window.flag === q.flag);
    if (q.mine) mapped = mapped.filter((r) => r.window.open && new Date(r.windowEndsAt) > now);

    const skip = q.skip ?? 0;
    const take = q.take ?? 50;
    return { data: mapped.slice(skip, skip + take), total: mapped.length };
  }

  private async toRows(rows: ListRow[], now: Date) {
    const names = await this.access.names(rows.map((r) => r.workerMemberId));
    return rows.map((r) => {
      const { Outreach, _count, workerMemberId, workerName, ...rest } = r;
      return {
        ...rest,
        contactDate: r.contactDate.toISOString(),
        callBackAt: r.callBackAt?.toISOString() ?? null,
        lastActionAt: r.lastActionAt?.toISOString() ?? null,
        windowEndsAt: r.windowEndsAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
        closedAt: r.closedAt?.toISOString() ?? null,
        invitedAt: r.invitedAt?.toISOString() ?? null,
        attendedAt: r.attendedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        worker: {
          id: workerMemberId,
          name: (workerMemberId && names.get(workerMemberId)?.name) || workerName,
          photoUrl: (workerMemberId && names.get(workerMemberId)?.photoUrl) || null,
        },
        outreach: Outreach,
        activityCount: _count.Activities,
        daysSinceContact: Math.max(0, Math.floor((now.getTime() - r.contactDate.getTime()) / DAY)),
        window: windowState(r, now),
      };
    });
  }

  async get(id: string) {
    const contact = await this.prisma.evangelismContact.findFirst({
      where: { id, tenantId: this.tenantId },
      select: {
        ...LIST_SELECT,
        discussion: true,
        createdById: true,
        updatedById: true,
        updatedAt: true,
        Activities: { orderBy: { happenedAt: 'desc' } },
        Tasks: {
          orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
          select: { id: true, title: true, type: true, status: true, priority: true, dueAt: true, Assignees: { select: { memberId: true } } },
        },
        Testimonies: { orderBy: { date: 'desc' }, select: { id: true, title: true, date: true, approved: true } },
      },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const { Activities, Tasks, Testimonies, discussion, createdById, updatedById, updatedAt, ...listPart } = contact;
    const [row] = await this.toRows([listPart], new Date());
    const people = await this.access.names([
      createdById,
      updatedById,
      ...Tasks.flatMap((t) => t.Assignees.map((a) => a.memberId)),
    ]);
    const now = new Date();
    return {
      ...row,
      discussion,
      createdBy: createdById ? (people.get(createdById)?.name ?? null) : null,
      updatedBy: updatedById ? (people.get(updatedById)?.name ?? null) : null,
      updatedAt: updatedAt.toISOString(),
      activities: Activities.map((a) => ({
        id: a.id,
        kind: a.kind,
        outcome: a.outcome,
        note: a.note,
        statusFrom: a.statusFrom,
        statusTo: a.statusTo,
        happenedAt: a.happenedAt.toISOString(),
        actor: { id: a.actorMemberId, name: a.actorName },
      })),
      tasks: Tasks.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        status: t.status,
        priority: t.priority,
        dueAt: t.dueAt?.toISOString() ?? null,
        overdue: t.status !== 'DONE' && !!t.dueAt && t.dueAt < now,
        assignees: t.Assignees.map((a) => ({ id: a.memberId, name: people.get(a.memberId)?.name ?? 'Former member' })),
      })),
      testimonies: Testimonies.map((t) => ({ ...t, date: t.date.toISOString() })),
    };
  }

  // ── Changing ───────────────────────────────────────────────────────────────

  async update(viewer: EvangelismViewer, id: string, dto: UpdateEvangelismContactDto) {
    const current = await this.prisma.evangelismContact.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!current) throw new NotFoundException('Contact not found');

    const data: Prisma.EvangelismContactUncheckedUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) {
      const phone = normaliseNigerianPhone(dto.phone);
      if (!phone) throw new BadRequestException('Enter a Nigerian phone number, like 0803 123 4567.');
      data.phone = phone;
    }
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.savedStatus !== undefined) data.savedStatus = dto.savedStatus;
    if (dto.isStudent !== undefined) data.isStudent = dto.isStudent;
    if (dto.school !== undefined) data.school = dto.school || null;
    if (dto.level !== undefined) data.level = dto.level || null;
    if (dto.discussion !== undefined) data.discussion = dto.discussion || null;
    if (dto.nextAction !== undefined) data.nextAction = dto.nextAction;
    if (dto.consent !== undefined) data.consent = dto.consent;
    if (dto.workerMemberId !== undefined || dto.workerName !== undefined) {
      const worker = await this.resolveWorker(viewer.unitId, dto.workerMemberId ?? undefined, dto.workerName);
      data.workerMemberId = worker.memberId;
      data.workerName = worker.name;
    }
    if (dto.outreachId !== undefined) data.outreachId = await this.resolveOutreach(dto.outreachId);
    if (dto.contactDate !== undefined) {
      const contactDate = this.contactDate(dto.contactDate);
      data.contactDate = contactDate;
      // An extension is the leader's decision; don't undo it by fixing a typo in the date.
      if (current.reviewOutcome !== 'EXTENDED') data.windowEndsAt = windowEnd(contactDate);
    }

    const changed = Object.keys(data).filter((key) => {
      const before = (current as Record<string, unknown>)[key];
      const after = (data as Record<string, unknown>)[key];
      return before instanceof Date && after instanceof Date ? before.getTime() !== after.getTime() : before !== after;
    });
    if (changed.length === 0) return this.get(id);

    const now = new Date();
    const fields = [...new Set(changed.map((k) => FIELD_LABELS[k] ?? k))];
    await this.prisma.$transaction([
      this.prisma.evangelismContact.update({ where: { id }, data: { ...data, updatedById: viewer.memberId, updatedAt: now } }),
      this.prisma.evangelismActivity.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          contactId: id,
          kind: 'EDIT',
          note: `Edited ${fields.join(', ')}`,
          happenedAt: now,
          actorMemberId: viewer.memberId,
          actorName: viewer.name,
        },
      }),
    ]);
    return this.get(id);
  }

  async remove(viewer: EvangelismViewer, id: string) {
    const current = await this.prisma.evangelismContact.findFirst({
      where: { id, tenantId: this.tenantId },
      select: { id: true, name: true },
    });
    if (!current) throw new NotFoundException('Contact not found');
    await this.prisma.evangelismContact.delete({ where: { id } });
    this.logger.log({ msg: 'evangelism contact deleted', contactId: id, by: viewer.memberId, byName: viewer.name });
    return { id, deleted: true };
  }

  /** A follow-up — call, visit, message, note — and/or a move to a new status. */
  async logAction(viewer: EvangelismViewer, id: string, dto: LogEvangelismActionDto) {
    const current = await this.prisma.evangelismContact.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!current) throw new NotFoundException('Contact not found');
    if (!dto.kind && !dto.status) throw new BadRequestException('Log what was done, or choose a new status.');
    if (dto.status === 'CALL_BACK' && !dto.callBackAt) throw new BadRequestException('Choose when to call back.');

    const now = new Date();
    const happenedAt = dto.happenedAt ? new Date(dto.happenedAt) : now;
    if (happenedAt.getTime() > now.getTime() + 5 * 60 * 1000) throw new BadRequestException('That date is in the future.');

    const data: Prisma.EvangelismContactUncheckedUpdateInput = {
      lastActionAt: !current.lastActionAt || happenedAt > current.lastActionAt ? happenedAt : current.lastActionAt,
      updatedById: viewer.memberId,
      updatedAt: now,
    };
    const statusChanged = !!dto.status && dto.status !== current.status;
    if (dto.status) {
      data.status = dto.status;
      data.callBackAt = dto.status === 'CALL_BACK' && dto.callBackAt ? new Date(dto.callBackAt) : null;
      if ((dto.status === 'INVITED' || dto.status === 'ATTENDED' || dto.status === 'JOINED') && !current.invitedAt) {
        data.invitedAt = happenedAt;
      }
      if ((dto.status === 'ATTENDED' || dto.status === 'JOINED') && !current.attendedAt) data.attendedAt = happenedAt;
    }

    await this.prisma.$transaction([
      this.prisma.evangelismContact.update({ where: { id }, data }),
      this.prisma.evangelismActivity.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          contactId: id,
          kind: dto.kind ?? 'STATUS',
          outcome: dto.outcome ?? null,
          note: dto.note ?? null,
          statusFrom: statusChanged ? current.status : null,
          statusTo: statusChanged ? (dto.status ?? null) : null,
          happenedAt,
          actorMemberId: viewer.memberId,
          actorName: viewer.name,
        },
      }),
    ]);
    return this.get(id);
  }

  /** The leader's call at the end of the window: hand over, extend, or close. */
  async review(viewer: EvangelismViewer, id: string, dto: ReviewEvangelismContactDto) {
    const current = await this.prisma.evangelismContact.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!current) throw new NotFoundException('Contact not found');

    const now = new Date();
    const data: Prisma.EvangelismContactUncheckedUpdateInput = {
      reviewOutcome: dto.outcome,
      reviewedAt: now,
      updatedById: viewer.memberId,
      updatedAt: now,
    };
    let note: string;
    if (dto.outcome === 'EXTENDED') {
      const days = dto.extendDays ?? 30;
      const from = current.windowEndsAt > now ? current.windowEndsAt : now;
      data.windowEndsAt = new Date(from.getTime() + days * DAY);
      data.closedAt = null;
      note = `Follow-up extended by ${days} days`;
    } else {
      data.closedAt = now;
      note = dto.outcome === 'HANDED_OVER' ? 'Handed over to the Follow-Up team' : 'Follow-up closed';
    }

    await this.prisma.$transaction([
      this.prisma.evangelismContact.update({ where: { id }, data }),
      this.prisma.evangelismActivity.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          contactId: id,
          kind: 'REVIEW',
          outcome: note,
          note: dto.note ?? null,
          happenedAt: now,
          actorMemberId: viewer.memberId,
          actorName: viewer.name,
        },
      }),
    ]);
    return this.get(id);
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  async summary(viewer: EvangelismViewer) {
    const now = new Date();
    const monthStart = startOfLagosMonth(now);
    const [contacts, myTasks] = await Promise.all([
      this.prisma.evangelismContact.findMany({
        where: { tenantId: this.tenantId },
        select: {
          contactDate: true,
          windowEndsAt: true,
          status: true,
          callBackAt: true,
          lastActionAt: true,
          reviewOutcome: true,
          closedAt: true,
          savedStatus: true,
          invitedAt: true,
          attendedAt: true,
          workerMemberId: true,
        },
      }),
      viewer.memberId
        ? this.prisma.evangelismTask.findMany({
            where: { tenantId: this.tenantId, status: { not: 'DONE' }, Assignees: { some: { memberId: viewer.memberId } } },
            select: { dueAt: true },
          })
        : Promise.resolve([] as { dueAt: Date | null }[]),
    ]);

    let saved = 0, savedThisMonth = 0, reachedThisMonth = 0, pending = 0, due = 0, overdue = 0, review = 0;
    let visitations = 0, invited = 0, attended = 0, mineInWindow = 0, mineOverdue = 0;
    for (const c of contacts) {
      const state = windowState(c, now);
      const thisMonth = c.contactDate >= monthStart;
      if (thisMonth) reachedThisMonth++;
      if (c.savedStatus === 'YES') {
        saved++;
        if (thisMonth) savedThisMonth++;
      }
      if (c.invitedAt) invited++;
      if (c.attendedAt) attended++;
      if (!state.open) continue;
      if (state.flag === 'REVIEW') review++;
      else pending++;
      if (state.flag === 'DUE') due++;
      if (state.flag === 'OVERDUE') overdue++;
      if (c.status === 'NEEDS_VISIT') visitations++;
      if (viewer.memberId && c.workerMemberId === viewer.memberId && state.flag !== 'REVIEW') {
        mineInWindow++;
        if (state.flag === 'OVERDUE') mineOverdue++;
      }
    }

    return {
      reached: contacts.length,
      reachedThisMonth,
      saved,
      savedThisMonth,
      pendingFollowUps: pending,
      dueFollowUps: due,
      overdueFollowUps: overdue,
      awaitingReview: review,
      visitationsNeeded: visitations,
      invited,
      attended,
      mine: {
        inWindow: mineInWindow,
        overdue: mineOverdue,
        openTasks: myTasks.length,
        overdueTasks: myTasks.filter((t) => t.dueAt && t.dueAt < now).length,
      },
    };
  }
}
