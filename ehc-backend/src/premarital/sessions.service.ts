import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CounsellingSession } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthUser } from '../auth/types/auth-user';
import { parseSchema } from '../common/zod-parse.util';
import { PrismaService } from '../prisma/prisma.service';
import { CaseAccess, can, notFound, type CaseTier } from './case-access';
import { counsellingAudit } from './counselling-audit';
import { CounsellingNotifier } from './counselling-notifier';
import { lagosDayStart, lagosToUtc } from './lagos-time';
import {
  attendanceSchema,
  rescheduleSchema,
  sessionCreateSchema,
  sessionPatchSchema,
  sessionsQuerySchema,
} from './premarital.schema';

const SCHEDULABLE = new Set([
  'ACCEPTED_FOR_COUNSELLING',
  'IN_COUNSELLING',
  'FINAL_REVIEW',
]);
const person = {
  select: { Member: { select: { firstName: true, lastName: true } } },
} as const;

/**
 * Sessions, attendance and module progress. Staff manage every session on a
 * case they can see; a counsellor manages only their own sessions on their own
 * cases. Times are entered in Lagos and stored in UTC.
 */
@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly notifier: CounsellingNotifier,
  ) {}

  private get tenantId() {
    return this.access.tenantId;
  }

  /** Staff see every session; a counsellor sees only their own. */
  async list(actor: AuthUser, rawQuery: unknown) {
    const tier = await this.access.requireStaffOrCounsellor(actor);
    const q = parseSchema(sessionsQuerySchema, rawQuery);
    const from = q.from
      ? lagosDayStart(q.from)
      : new Date(Date.now() - 86_400_000);
    const to = q.to
      ? new Date(lagosDayStart(q.to).getTime() + 86_400_000)
      : new Date(Date.now() + 60 * 86_400_000);
    const rows = await this.prisma.counsellingSession.findMany({
      where: {
        tenantId: this.tenantId,
        scheduledAt: { gte: from, lt: to },
        Application: {
          archivedAt: null,
          ...(tier === 'PASTOR' ? {} : { safeguardingFlaggedAt: null }),
        },
        ...(tier === 'COUNSELLOR'
          ? { counsellorProfileId: actor.profileId! }
          : {}),
      },
      orderBy: { scheduledAt: 'asc' },
      take: 500,
      include: {
        Counsellor: person,
        Module: { select: { id: true, title: true } },
        Application: {
          select: {
            id: true,
            referenceCode: true,
            applicantFirstName: true,
            applicantLastName: true,
            partnerFirstName: true,
            partnerLastName: true,
          },
        },
      },
    });
    return rows.map(({ Counsellor, ...s }) => ({
      ...s,
      counsellorName: Counsellor.Member
        ? `${Counsellor.Member.firstName} ${Counsellor.Member.lastName}`
        : null,
    }));
  }

  async create(actor: AuthUser, applicationId: string, raw: unknown) {
    const { app, tier } = await this.access.open(actor, applicationId);
    const input = parseSchema(sessionCreateSchema, raw);
    if (!SCHEDULABLE.has(app.status))
      throw new BadRequestException(
        'Sessions can be booked once the case is accepted for counselling',
      );
    const counsellorProfileId = await this.counsellorFor(
      actor,
      tier,
      applicationId,
      input.counsellorProfileId,
    );
    const scheduledAt = lagosToUtc(input.date, input.time);
    if (scheduledAt.getTime() <= Date.now())
      throw new BadRequestException('Pick a time in the future');
    if (input.moduleId) await this.requireModule(input.moduleId);
    const session = await this.prisma.$transaction(async (tx) => {
      const row = await tx.counsellingSession.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          applicationId,
          counsellorProfileId,
          moduleId: input.moduleId ?? null,
          scheduledAt,
          durationMinutes: input.durationMinutes ?? 60,
          format: input.format,
          location: input.format === 'PHYSICAL' ? input.location! : null,
          meetingLink: input.format === 'ONLINE' ? input.meetingLink! : null,
          createdById: actor.profileId ?? actor.userId,
        },
      });
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: 'COUNSELLING_SESSION_SCHEDULED',
        entity: 'CounsellingSession',
        entityId: row.id,
      });
      return row;
    });
    await this.notifier.send(app, 'SESSION_SCHEDULED', session.scheduledAt);
    return session;
  }

  /** Moves a session: the old one is kept as RESCHEDULED and a new one takes its place. */
  async reschedule(actor: AuthUser, sessionId: string, raw: unknown) {
    const { session, app } = await this.manageable(actor, sessionId);
    const { date, time } = parseSchema(rescheduleSchema, raw);
    const scheduledAt = lagosToUtc(date, time);
    if (scheduledAt.getTime() <= Date.now())
      throw new BadRequestException('Pick a time in the future');
    const moved = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.counsellingSession.updateMany({
        where: { id: sessionId, status: 'SCHEDULED' },
        data: { status: 'RESCHEDULED' },
      });
      if (count === 0)
        throw new BadRequestException('Only a booked session can be moved');
      const {
        id: _id,
        createdAt: _c,
        updatedAt: _u,
        reminderSentAt: _r,
        ...rest
      } = session;
      const row = await tx.counsellingSession.create({
        data: {
          ...rest,
          id: randomUUID(),
          scheduledAt,
          status: 'SCHEDULED',
          attendance: 'UNMARKED',
          rescheduledFromId: sessionId,
          createdById: actor.profileId ?? actor.userId,
        },
      });
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: 'COUNSELLING_SESSION_RESCHEDULED',
        entity: 'CounsellingSession',
        entityId: row.id,
      });
      return row;
    });
    await this.notifier.send(app, 'SESSION_RESCHEDULED', moved.scheduledAt);
    return moved;
  }

  /** Edits that keep the time. A field that is not sent is left as it is. */
  async update(actor: AuthUser, sessionId: string, raw: unknown) {
    const { session } = await this.manageable(actor, sessionId);
    const patch = parseSchema(sessionPatchSchema, raw);
    const merged = {
      format: patch.format ?? session.format,
      location: 'location' in patch ? patch.location : session.location,
      meetingLink:
        'meetingLink' in patch ? patch.meetingLink : session.meetingLink,
    };
    if (merged.format === 'PHYSICAL' && !merged.location)
      throw new BadRequestException('Say where you will meet');
    if (merged.format === 'ONLINE' && !merged.meetingLink)
      throw new BadRequestException('Add the meeting link');
    if (patch.moduleId) await this.requireModule(patch.moduleId);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.counsellingSession.update({
        where: { id: sessionId },
        data: patch,
      });
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: 'COUNSELLING_SESSION_UPDATED',
        entity: 'CounsellingSession',
        entityId: sessionId,
      });
      return row;
    });
  }

  async cancel(actor: AuthUser, sessionId: string) {
    const { app } = await this.manageable(actor, sessionId);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.counsellingSession.updateMany({
        where: { id: sessionId, status: 'SCHEDULED' },
        data: { status: 'CANCELLED' },
      });
      if (count === 0)
        throw new BadRequestException('Only a booked session can be cancelled');
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: 'COUNSELLING_SESSION_CANCELLED',
        entity: 'CounsellingSession',
        entityId: sessionId,
      });
    });
    await this.notifier.send(app, 'SESSION_CANCELLED');
    return { cancelled: sessionId };
  }

  /** Marking who came also marks a booked session as held. */
  async attendance(actor: AuthUser, sessionId: string, raw: unknown) {
    const { session } = await this.manageable(actor, sessionId, true);
    const { attendance } = parseSchema(attendanceSchema, raw);
    if (session.status === 'CANCELLED' || session.status === 'RESCHEDULED')
      throw new BadRequestException('This session did not take place');
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.counsellingSession.update({
        where: { id: sessionId },
        data: {
          attendance,
          ...(attendance !== 'UNMARKED'
            ? { status: 'COMPLETED' as const }
            : {}),
        },
      });
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: 'COUNSELLING_ATTENDANCE_MARKED',
        entity: 'CounsellingSession',
        entityId: sessionId,
      });
      return row;
    });
  }

  async setProgress(
    actor: AuthUser,
    applicationId: string,
    moduleId: string,
    done: boolean,
  ) {
    const { tier } = await this.access.open(actor, applicationId);
    if (!can(tier, 'triage') && tier !== 'COUNSELLOR') throw notFound();
    await this.requireModule(moduleId);
    await this.prisma.$transaction(async (tx) => {
      if (done) {
        await tx.counsellingProgress.upsert({
          where: { applicationId_moduleId: { applicationId, moduleId } },
          create: {
            id: randomUUID(),
            tenantId: this.tenantId,
            applicationId,
            moduleId,
            markedById: actor.profileId ?? actor.userId,
          },
          update: {},
        });
      } else {
        await tx.counsellingProgress.deleteMany({
          where: { applicationId, moduleId },
        });
      }
      await counsellingAudit(tx, {
        tenantId: this.tenantId,
        actor,
        action: done ? 'COUNSELLING_MODULE_DONE' : 'COUNSELLING_MODULE_UNDONE',
        entity: 'CounsellingApplication',
        entityId: applicationId,
      });
    });
    return { moduleId, done };
  }

  /**
   * Reminders, from Cloud Scheduler every hour: a session in the next 24 hours
   * that has had no reminder. The reminder is claimed before it is sent, so a
   * retry or two runs at once never send it twice.
   */
  async sendReminders(now = new Date()): Promise<number> {
    const due = await this.prisma.counsellingSession.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'SCHEDULED',
        reminderSentAt: null,
        scheduledAt: { gt: now, lte: new Date(now.getTime() + 86_400_000) },
        Application: {
          archivedAt: null,
          status: { notIn: ['COMPLETED', 'CLOSED'] },
        },
      },
      include: {
        Application: {
          select: {
            id: true,
            tenantId: true,
            applicantFirstName: true,
            applicantEmail: true,
          },
        },
      },
      take: 200,
    });
    let sent = 0;
    for (const s of due) {
      const { count } = await this.prisma.counsellingSession.updateMany({
        where: { id: s.id, reminderSentAt: null },
        data: { reminderSentAt: now },
      });
      if (count === 0) continue;
      const result = await this.notifier.send(
        s.Application,
        'SESSION_REMINDER',
        s.scheduledAt,
      );
      if (result === 'SKIPPED')
        await this.prisma.counsellingSession.update({
          where: { id: s.id },
          data: { reminderSentAt: null },
        });
      else sent++;
    }
    if (due.length)
      this.logger.log(`counselling reminders: ${sent} of ${due.length} sent`);
    return sent;
  }

  /** Staff may book for any active counsellor on the case; a counsellor books for themselves. */
  private async counsellorFor(
    actor: AuthUser,
    tier: CaseTier,
    applicationId: string,
    wanted?: string,
  ): Promise<string> {
    const active = await this.prisma.counsellingAssignment.findMany({
      where: { applicationId, active: true },
      select: { counsellorProfileId: true, isLead: true },
    });
    if (tier === 'COUNSELLOR') return actor.profileId!;
    if (!can(tier, 'triage')) throw notFound();
    const pick = wanted ?? active.find((a) => a.isLead)?.counsellorProfileId;
    if (!pick || !active.some((a) => a.counsellorProfileId === pick))
      throw new BadRequestException(
        'Assign a counsellor to the case first, then book the session with them',
      );
    return pick;
  }

  /** The session and its case, if this person may manage it; otherwise 404. */
  private async manageable(
    actor: AuthUser,
    sessionId: string,
    allowFinished = false,
  ): Promise<{
    session: CounsellingSession;
    app: {
      id: string;
      tenantId: string;
      applicantFirstName: string;
      applicantEmail: string;
    };
  }> {
    const session = await this.prisma.counsellingSession.findFirst({
      where: { id: sessionId, tenantId: this.tenantId },
    });
    if (!session) throw notFound();
    const { app, tier } = await this.access.open(actor, session.applicationId);
    const own =
      tier === 'COUNSELLOR' && session.counsellorProfileId === actor.profileId;
    if (!can(tier, 'triage') && !own) throw notFound();
    if (!allowFinished && session.status !== 'SCHEDULED')
      throw new BadRequestException('Only a booked session can be changed');
    return { session, app };
  }

  private async requireModule(moduleId: string) {
    const m = await this.prisma.counsellingModule.findFirst({
      where: { id: moduleId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!m) throw new BadRequestException('That module was not found');
  }
}
