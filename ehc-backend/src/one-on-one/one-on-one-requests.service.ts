import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PastoralBookingStatus, PastoralMeetingFormat, PastoralRequesterType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { GoogleTokenCipherService } from '../calendar/services/google-token-cipher.service';
import { IcsBuilderService } from '../calendar/services/ics-builder.service';
import {
  ApproveDto,
  AssignRequestDto,
  CreateRequestDto,
  CreateVisitorRequestDto,
  DecisionNoteDto,
  ProposeTimeDto,
  SetMeetingLinkDto,
} from './dto/one-on-one.dto';
import { OneOnOneService, type Audience } from './one-on-one.service';
import { OneOnOneNotifyService, type NotifyBooking } from './one-on-one-notify.service';
import { OneOnOneCalendarService } from './one-on-one-calendar.service';
import { OneOnOneLinksService } from './one-on-one-links.service';
import { localDateKey } from './slot-engine';

/** A requester may cancel an approved session themself only this far ahead. */
const SELF_CANCEL_HOURS = 24;
/** How long an unconfirmed visitor request holds its time. */
const VISITOR_HOLD_MINUTES = 30;

const OPEN_STATUSES: PastoralBookingStatus[] = [
  PastoralBookingStatus.HOLD,
  PastoralBookingStatus.PENDING,
  PastoralBookingStatus.PROPOSED,
  PastoralBookingStatus.APPROVED,
];

const BOOKING_INCLUDE = {
  Host: { select: { displayName: true, profileId: true, defaultMeetingLink: true } },
  CoHost: { select: { displayName: true } },
  SessionType: { select: { name: true, durationMinutes: true } },
} satisfies Prisma.PastoralBookingInclude;

export type BookingRow = Prisma.PastoralBookingGetPayload<{ include: typeof BOOKING_INCLUDE }>;

@Injectable()
export class OneOnOneRequestsService {
  private readonly logger = new Logger(OneOnOneRequestsService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly oneOnOne: OneOnOneService,
    private readonly notify: OneOnOneNotifyService,
    private readonly cipher: GoogleTokenCipherService,
    private readonly calendar: OneOnOneCalendarService,
    private readonly links: OneOnOneLinksService,
    private readonly ics: IcsBuilderService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  // ── Shapes ────────────────────────────────────────────────────────────────

  static include = BOOKING_INCLUDE;

  toNotify(b: BookingRow): NotifyBooking {
    return {
      id: b.id,
      hostId: b.hostId,
      coHostId: b.coHostId,
      hostName: b.Host.displayName,
      coHostName: b.CoHost?.displayName ?? null,
      typeName: b.SessionType.name,
      requesterType: b.requesterType,
      memberProfileId: b.memberProfileId,
      requesterName: b.requesterName,
      requesterEmail: b.requesterEmail,
      requesterTimezone: b.requesterTimezone,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      proposedStartsAt: b.proposedStartsAt,
      proposedEndsAt: b.proposedEndsAt,
      format: b.format,
      topic: b.topic,
      meetLink: b.status === PastoralBookingStatus.APPROVED ? b.meetLink : null,
      anonymous: b.anonymousIntake,
    };
  }

  private base(b: BookingRow) {
    return {
      id: b.id,
      status: b.status,
      hostId: b.hostId,
      hostName: b.Host.displayName,
      coHostName: b.CoHost?.displayName ?? null,
      sessionTypeId: b.sessionTypeId,
      sessionTypeName: b.SessionType.name,
      durationMinutes: b.SessionType.durationMinutes,
      startsAt: b.startsAt.toISOString(),
      endsAt: b.endsAt.toISOString(),
      proposedStartsAt: b.proposedStartsAt?.toISOString() ?? null,
      proposedEndsAt: b.proposedEndsAt?.toISOString() ?? null,
      format: b.format,
      topic: b.topic,
      decisionNote: b.decisionNote,
      meetLink: b.status === PastoralBookingStatus.APPROVED ? b.meetLink : null,
      cancelledBy: b.cancelledBy,
      createdAt: b.createdAt.toISOString(),
    };
  }

  /** What the person who asked sees. A request from the nameless page names no one until a pastor takes it up. */
  private requesterView(b: BookingRow) {
    const view = { ...this.base(b), canCancel: this.canRequesterCancel(b) };
    return b.anonymousIntake ? { ...view, hostName: 'One of our pastors', coHostName: null } : view;
  }

  private canRequesterCancel(b: BookingRow, now = new Date()): boolean {
    if (b.status === PastoralBookingStatus.PENDING || b.status === PastoralBookingStatus.PROPOSED) return true;
    return b.status === PastoralBookingStatus.APPROVED && b.startsAt.getTime() - now.getTime() > SELF_CANCEL_HOURS * 3_600_000;
  }

  private decryptNote(b: BookingRow): string | null {
    if (!b.noteEncrypted || !this.cipher.isConfigured) return null;
    try {
      return this.cipher.decrypt(b.noteEncrypted);
    } catch {
      return null;
    }
  }

  private async reload(id: string): Promise<BookingRow> {
    return this.prisma.pastoralBooking.findUniqueOrThrow({ where: { id }, include: BOOKING_INCLUDE });
  }

  /** Re-checks a start time against live availability inside a serializable transaction, then runs `write`. */
  private async withFreshSlot<T>(
    args: { hostId: string; sessionTypeId: string; startsAt: Date; excludeBookingId?: string; audience?: Audience },
    write: (tx: Prisma.TransactionClient, endsAt: Date) => Promise<T>,
  ): Promise<T> {
    const date = localDateKey(args.startsAt);
    // Google is called once, outside the transaction, so a slow API never holds it open.
    const externalBusy = await this.oneOnOne.externalBusyFor(args.hostId, args.sessionTypeId, date, date);
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const days = await this.oneOnOne.computeOpenSlots(args.hostId, args.sessionTypeId, date, date, {
            db: tx,
            excludeBookingId: args.excludeBookingId,
            externalBusy,
            audience: args.audience,
          });
          const slot = days[0]?.slots.find((s) => s.startsAt === args.startsAt.toISOString());
          if (!slot) throw new ConflictException('That time is no longer available. Please pick another.');
          return write(tx, new Date(slot.endsAt));
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
        throw new ConflictException('Someone else just took that time. Please pick another.');
      }
      throw err;
    }
  }

  private encryptNote(note: string | null): string | null {
    if (!note) return null;
    if (!this.cipher.isConfigured) {
      throw new BadRequestException("Private notes can't be stored securely right now. Send the request without a note.");
    }
    return this.cipher.encrypt(note);
  }

  /** A topic is required unless the session type has switched the question off, in which case none is kept. */
  private topicFor(askTopic: boolean, topic?: string): string | null {
    if (!askTopic) return null;
    if (!topic) throw new BadRequestException('Choose what you’d like to talk about.');
    return topic;
  }

  // ── Members ───────────────────────────────────────────────────────────────

  async createMemberRequest(user: AuthUser, dto: CreateRequestDto) {
    if (!user.profileId) throw new ForbiddenException('No profile');
    const noteEncrypted = this.encryptNote(dto.note?.trim() || null);

    const open = await this.prisma.pastoralBooking.findFirst({
      where: { tenantId: this.tenantId, memberProfileId: user.profileId, status: { in: OPEN_STATUSES }, endsAt: { gt: new Date() } },
    });
    if (open) {
      throw new ConflictException('You already have a session requested or booked. You can request another once it has happened, or withdraw it first.');
    }

    const type = await this.prisma.pastorSessionType.findFirst({
      where: { id: dto.sessionTypeId, hostId: dto.hostId, active: true, Host: { active: true, tenantId: this.tenantId } },
    });
    if (!type) throw new NotFoundException('Session type not found');
    const topic = this.topicFor(type.askTopic, dto.topic);

    const member = await this.prisma.member.findFirst({
      where: { profileId: user.profileId },
      select: { firstName: true, lastName: true, email: true, phone: true },
    });
    const startsAt = new Date(dto.startsAt);
    const id = randomUUID();
    await this.withFreshSlot({ hostId: dto.hostId, sessionTypeId: type.id, startsAt }, (tx, endsAt) =>
      tx.pastoralBooking.create({
        data: {
          id,
          tenantId: this.tenantId,
          hostId: dto.hostId,
          coHostId: type.jointWithHostId,
          sessionTypeId: type.id,
          requesterType: PastoralRequesterType.MEMBER,
          memberProfileId: user.profileId,
          requesterName: member ? `${member.firstName} ${member.lastName}`.trim() : user.email,
          requesterEmail: member?.email || user.email,
          requesterPhone: member?.phone ?? null,
          startsAt,
          endsAt,
          status: PastoralBookingStatus.PENDING,
          format: dto.format,
          topic,
          noteEncrypted,
        },
      }),
    );

    const row = await this.reload(id);
    void this.notify.toRequester(this.toNotify(row), 'RECEIVED');
    void this.notify.toHostSide(this.toNotify(row), 'NEW');
    return this.requesterView(row);
  }

  async listMine(user: AuthUser) {
    const rows = await this.prisma.pastoralBooking.findMany({
      where: { tenantId: this.tenantId, memberProfileId: user.profileId ?? '' },
      include: BOOKING_INCLUDE,
      orderBy: { startsAt: 'desc' },
      take: 50,
    });
    return rows.map((b) => this.requesterView(b));
  }

  private async loadMine(user: AuthUser, id: string): Promise<BookingRow> {
    const b = await this.prisma.pastoralBooking.findFirst({ where: { id, tenantId: this.tenantId }, include: BOOKING_INCLUDE });
    if (!b || b.memberProfileId !== user.profileId) throw new NotFoundException('Session not found');
    return b;
  }

  async cancelMine(user: AuthUser, id: string, dto: DecisionNoteDto) {
    return this.cancelByRequester(await this.loadMine(user, id), dto.note);
  }

  async acceptProposal(user: AuthUser, id: string) {
    return this.acceptProposalFor(await this.loadMine(user, id));
  }

  async icsForMember(user: AuthUser, id: string) {
    return this.buildIcs(await this.loadMine(user, id));
  }

  // ── Visitors ──────────────────────────────────────────────────────────────

  /**
   * A visitor's request holds its time for 30 minutes and reaches the pastor
   * only once they confirm their email from the link we send. The response
   * never says whether an email is already known, so the form can't be used
   * to probe who has asked before.
   */
  async createVisitorRequest(dto: CreateVisitorRequestDto) {
    if (dto.website) return { status: 'HOLD' as const };
    const email = dto.email.trim().toLowerCase();
    if (dto.format === PastoralMeetingFormat.IN_PERSON && !dto.inIbadan) {
      throw new BadRequestException('In-person sessions are for people in or near Ibadan. Choose a video or phone call.');
    }
    const noteEncrypted = this.encryptNote(dto.note?.trim() || null);

    const open = await this.prisma.pastoralBooking.findFirst({
      where: {
        tenantId: this.tenantId,
        requesterType: PastoralRequesterType.VISITOR,
        requesterEmail: email,
        status: { in: OPEN_STATUSES },
        endsAt: { gt: new Date() },
        OR: [{ status: { not: PastoralBookingStatus.HOLD } }, { holdExpiresAt: { gt: new Date() } }],
      },
    });
    if (open) {
      if (open.status === PastoralBookingStatus.HOLD) {
        void this.reload(open.id).then((row) => this.notify.toRequester(this.toNotify(row), 'VERIFY'));
      }
      throw new ConflictException('There’s already a request for this email. Check your inbox for the link to see or change it.');
    }

    const type = await this.prisma.pastorSessionType.findFirst({
      where: {
        id: dto.sessionTypeId,
        hostId: dto.hostId,
        active: true,
        visitorsCanBook: true,
        jointWithHostId: null,
        Host: { active: true, visitorsAllowed: true, tenantId: this.tenantId, ...(dto.viaIntake && { publicIntake: true }) },
      },
    });
    if (!type) throw new NotFoundException('Session type not found');
    const topic = this.topicFor(type.askTopic, dto.topic);
    const anonymousIntake = Boolean(dto.viaIntake);

    const fullName = dto.fullName.trim();
    const visitorId = await this.upsertVisitor({ fullName, email, phone: dto.phone.trim(), foundVia: dto.foundVia, inIbadan: dto.inIbadan });
    const startsAt = new Date(dto.startsAt);
    const id = randomUUID();
    await this.withFreshSlot({ hostId: dto.hostId, sessionTypeId: type.id, startsAt, audience: 'VISITOR' }, (tx, endsAt) =>
      tx.pastoralBooking.create({
        data: {
          id,
          tenantId: this.tenantId,
          hostId: dto.hostId,
          sessionTypeId: type.id,
          requesterType: PastoralRequesterType.VISITOR,
          visitorId,
          requesterName: fullName,
          requesterEmail: email,
          requesterPhone: dto.phone.trim(),
          requesterLocation: dto.location.trim(),
          requesterTimezone: dto.timezone?.trim() || null,
          foundVia: dto.foundVia,
          startsAt,
          endsAt,
          status: PastoralBookingStatus.HOLD,
          anonymousIntake,
          holdExpiresAt: new Date(Date.now() + VISITOR_HOLD_MINUTES * 60_000),
          format: dto.format,
          topic,
          noteEncrypted,
        },
      }),
    );

    const row = await this.reload(id);
    void this.notify.toRequester(this.toNotify(row), 'VERIFY');
    return { status: 'HOLD' as const };
  }

  /** Keeps visitors on the church's records alongside first-timers, matched by email. */
  private async upsertVisitor(v: { fullName: string; email: string; phone: string; foundVia: string; inIbadan: boolean }): Promise<string> {
    const existing = await this.prisma.visitor.findFirst({
      where: { tenantId: this.tenantId, email: { equals: v.email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) {
      await this.prisma.visitor.update({ where: { id: existing.id }, data: { phone: v.phone, locatedInIbadan: v.inIbadan } });
      return existing.id;
    }
    const [firstName, ...rest] = v.fullName.split(/\s+/);
    const id = randomUUID();
    await this.prisma.visitor.create({
      data: {
        id,
        tenantId: this.tenantId,
        firstName,
        lastName: rest.join(' ') || '-',
        email: v.email,
        phone: v.phone,
        howDidYouLearn: v.foundVia,
        locatedInIbadan: v.inIbadan,
        attendanceType: 'One-on-One request',
      },
    });
    return id;
  }

  private async loadByToken(token: string): Promise<BookingRow> {
    const id = this.links.bookingIdFrom(token);
    const b = id
      ? await this.prisma.pastoralBooking.findFirst({
          where: { id, tenantId: this.tenantId, requesterType: PastoralRequesterType.VISITOR },
          include: BOOKING_INCLUDE,
        })
      : null;
    if (!b) throw new NotFoundException('This link isn’t valid. Check that you copied the whole link from the email.');
    return b;
  }

  async getByToken(token: string) {
    const b = await this.loadByToken(token);
    return { ...this.requesterView(b), requesterName: b.requesterName, requesterTimezone: b.requesterTimezone, holdExpiresAt: b.holdExpiresAt?.toISOString() ?? null };
  }

  /** The visitor confirms their email: the request now reaches the pastor. Safe to repeat. */
  async confirmByToken(token: string) {
    const b = await this.loadByToken(token);
    if (b.status !== PastoralBookingStatus.HOLD) return this.getByToken(token);

    if (!b.holdExpiresAt || b.holdExpiresAt <= new Date()) {
      // The hold ran out; the time is only theirs if nobody else has taken it since.
      try {
        await this.withFreshSlot({ hostId: b.hostId, sessionTypeId: b.sessionTypeId, startsAt: b.startsAt, excludeBookingId: b.id, audience: 'VISITOR' }, (tx) =>
          tx.pastoralBooking.update({ where: { id: b.id }, data: { status: PastoralBookingStatus.PENDING, emailVerifiedAt: new Date() } }),
        );
      } catch (err) {
        await this.prisma.pastoralBooking.update({ where: { id: b.id }, data: { status: PastoralBookingStatus.LAPSED } });
        if (err instanceof ConflictException) {
          throw new ConflictException('Sorry, that time was taken while your request waited for confirmation. Please pick another time.');
        }
        throw err;
      }
    } else {
      await this.prisma.pastoralBooking.update({ where: { id: b.id }, data: { status: PastoralBookingStatus.PENDING, emailVerifiedAt: new Date() } });
    }

    const row = await this.reload(b.id);
    void this.notify.toRequester(this.toNotify(row), 'RECEIVED');
    void this.notify.toHostSide(this.toNotify(row), 'NEW');
    return this.getByToken(token);
  }

  async cancelByToken(token: string, dto: DecisionNoteDto) {
    await this.cancelByRequester(await this.loadByToken(token), dto.note);
    return this.getByToken(token);
  }

  async acceptProposalByToken(token: string) {
    await this.acceptProposalFor(await this.loadByToken(token));
    return this.getByToken(token);
  }

  async icsByToken(token: string) {
    return this.buildIcs(await this.loadByToken(token));
  }

  // ── Requester actions, shared by members and visitors ────────────────────

  /** The requester must say why: the pastor reads it in the email that tells them the time is free. */
  private async cancelByRequester(b: BookingRow, reason?: string) {
    const why = reason?.trim() ?? '';
    if (why.length < 3) throw new BadRequestException('Please let the pastor know why you’re cancelling.');
    if (!this.canRequesterCancel(b)) {
      throw new ConflictException(
        b.status === PastoralBookingStatus.APPROVED
          ? `Sessions can be cancelled here up to ${SELF_CANCEL_HOURS} hours before. Please contact the church office.`
          : 'This request can no longer be withdrawn.',
      );
    }
    const updated = await this.prisma.pastoralBooking.update({
      where: { id: b.id },
      data: { status: PastoralBookingStatus.CANCELLED, cancelledAt: new Date(), cancelledBy: 'REQUESTER', cancelReason: why },
      include: BOOKING_INCLUDE,
    });
    if (b.googleEventId) void this.calendar.deleteEvent(b.Host.profileId, b.googleEventId);
    void this.notify.toHostSide(this.toNotify(updated), 'WITHDRAWN', why);
    return this.requesterView(updated);
  }

  /** Accepting the pastor's suggested time books it: the pastor proposed it, so it needs no second approval. */
  private async acceptProposalFor(b: BookingRow) {
    if (b.status !== PastoralBookingStatus.PROPOSED || !b.proposedStartsAt || !b.proposedEndsAt) {
      throw new ConflictException('There is no suggested time to accept.');
    }
    if (b.proposedStartsAt <= new Date()) throw new ConflictException('That suggested time has passed. Please pick another.');

    await this.prisma.pastoralBooking.update({
      where: { id: b.id },
      data: { status: PastoralBookingStatus.APPROVED, startsAt: b.proposedStartsAt, endsAt: b.proposedEndsAt, proposedStartsAt: null, proposedEndsAt: null },
    });
    await this.attachCalendarEvent(await this.reload(b.id), null);
    const updated = await this.reload(b.id);
    void this.notify.toHostSide(this.toNotify(updated), 'ACCEPTED_PROPOSAL');
    void this.notify.toRequester(this.toNotify(updated), 'APPROVED', b.decisionNote);
    return this.requesterView(updated);
  }

  /**
   * Puts an approved session in the pastor's Google Calendar and settles its
   * meeting link: one pasted by the pastor wins, then a Meet Google creates,
   * then the pastor's standing link. In-person and phone sessions get no link.
   */
  private async attachCalendarEvent(b: BookingRow, pastedLink: string | null) {
    const online = b.format === PastoralMeetingFormat.GOOGLE_MEET;
    const event = await this.calendar.createEvent({
      hostProfileId: b.Host.profileId,
      summary: `One-on-One: ${b.requesterName}`,
      description: [
        `${b.SessionType.name}, requested through the church website.`,
        b.topic ? `About: ${b.topic}` : null,
        `How: ${{ IN_PERSON: 'In person, church office', GOOGLE_MEET: 'Video call', PHONE: 'Phone call' }[b.format]}`,
        b.requesterPhone ? `Phone: ${b.requesterPhone}` : null,
        pastedLink ? `Meeting link: ${pastedLink}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      start: b.startsAt,
      end: b.endsAt,
      attendeeEmail: b.requesterEmail,
      withMeet: online && !pastedLink,
    });
    const meetLink = online ? (pastedLink ?? event?.meetLink ?? b.Host.defaultMeetingLink ?? null) : null;
    await this.prisma.pastoralBooking.update({
      where: { id: b.id },
      data: { googleEventId: event?.eventId || null, meetLink },
    });
  }

  private buildIcs(b: BookingRow) {
    if (b.status !== PastoralBookingStatus.APPROVED) throw new ConflictException('Only an approved session can be added to a calendar.');
    const pastors = b.CoHost ? `${b.Host.displayName} and ${b.CoHost.displayName}` : b.Host.displayName;
    const cal = this.ics.createCalendar({ name: 'Everlasting Hills Church' });
    this.ics.addEvent(cal, {
      uid: `pastoral-session-${b.id}@everlastinghills`,
      summary: `One-on-One with ${pastors}`,
      description: [b.SessionType.name, b.topic ? `About: ${b.topic}` : null, b.meetLink ? `Join: ${b.meetLink}` : null].filter(Boolean).join('\n'),
      location: b.format === PastoralMeetingFormat.IN_PERSON ? 'Everlasting Hills Church office, Ibadan' : (b.meetLink ?? undefined),
      url: b.meetLink ?? undefined,
      start: b.startsAt,
      end: b.endsAt,
      alarmMinutesBefore: 60,
    });
    return { filename: 'one-on-one-session.ics', body: this.ics.toString(cal) };
  }

  // ── Pastors and delegates ─────────────────────────────────────────────────

  async listForHost(user: AuthUser, hostId: string) {
    const { isOwner } = await this.oneOnOne.assertCanManage(user, hostId);
    const now = new Date();
    const rows = await this.prisma.pastoralBooking.findMany({
      where: {
        tenantId: this.tenantId,
        OR: [{ hostId }, { coHostId: hostId }],
        status: { not: PastoralBookingStatus.HOLD },
        startsAt: { gte: new Date(now.getTime() - 30 * 24 * 3_600_000) },
      },
      include: BOOKING_INCLUDE,
      orderBy: { startsAt: 'asc' },
    });

    // Only the pastor the request was made to reads the private note — not a delegate, not a co-host.
    const view = (b: BookingRow) => ({
      ...this.base(b),
      requesterType: b.requesterType,
      requesterName: b.requesterName,
      requesterEmail: b.requesterEmail,
      requesterPhone: b.requesterPhone,
      requesterLocation: b.requesterLocation,
      foundVia: b.foundVia,
      hasNote: Boolean(b.noteEncrypted),
      viaPublicPage: b.anonymousIntake,
      assigned: Boolean(b.assignedAt),
      note: isOwner && b.hostId === hostId ? this.decryptNote(b) : null,
    });

    const live = (b: BookingRow) => b.status === PastoralBookingStatus.APPROVED && b.endsAt > now;
    return {
      waiting: rows.filter((b) => b.status === PastoralBookingStatus.PENDING && b.startsAt > now).map(view),
      awaitingRequester: rows.filter((b) => b.status === PastoralBookingStatus.PROPOSED).map(view),
      upcoming: rows.filter(live).map(view),
      recent: rows
        .filter((b) => !live(b) && b.status !== PastoralBookingStatus.PENDING && b.status !== PastoralBookingStatus.PROPOSED)
        .reverse()
        .slice(0, 15)
        .map(view),
    };
  }

  private async loadForHost(user: AuthUser, hostId: string, id: string): Promise<BookingRow> {
    await this.oneOnOne.assertCanManage(user, hostId);
    const b = await this.prisma.pastoralBooking.findFirst({
      where: { id, tenantId: this.tenantId, OR: [{ hostId }, { coHostId: hostId }] },
      include: BOOKING_INCLUDE,
    });
    if (!b) throw new NotFoundException('Request not found');
    return b;
  }

  async approve(user: AuthUser, hostId: string, id: string, dto: ApproveDto) {
    const b = await this.loadForHost(user, hostId, id);
    if (b.status !== PastoralBookingStatus.PENDING) throw new ConflictException('This request has already been decided.');
    if (b.startsAt <= new Date()) throw new ConflictException('This time has already passed.');

    const note = dto.note?.trim() || null;
    await this.prisma.pastoralBooking.update({
      where: { id },
      data: { status: PastoralBookingStatus.APPROVED, decidedAt: new Date(), decidedById: user.profileId, decisionNote: note, anonymousIntake: false },
    });
    await this.attachCalendarEvent(await this.reload(id), dto.meetLink?.trim() || null);
    const updated = await this.reload(id);
    void this.notify.toRequester(this.toNotify(updated), 'APPROVED', note);
    return this.base(updated);
  }

  /** Add or change the Google Meet or Zoom link on an upcoming session; the requester is told. */
  async setMeetingLink(user: AuthUser, hostId: string, id: string, dto: SetMeetingLinkDto) {
    const b = await this.loadForHost(user, hostId, id);
    if (b.status !== PastoralBookingStatus.APPROVED || b.endsAt <= new Date()) {
      throw new ConflictException('A link can only be set on an upcoming approved session.');
    }
    const updated = await this.prisma.pastoralBooking.update({ where: { id }, data: { meetLink: dto.meetLink.trim() }, include: BOOKING_INCLUDE });
    void this.notify.toRequester(this.toNotify(updated), 'LINK_UPDATED');
    return this.base(updated);
  }

  /**
   * Passes a waiting request to another pastor, typically from the one who
   * receives the nameless public page. It keeps its time; if that time doesn't
   * suit them, they suggest another. Their side is told, with a warning when
   * the time falls outside their hours.
   */
  async assign(user: AuthUser, hostId: string, id: string, dto: AssignRequestDto) {
    const b = await this.loadForHost(user, hostId, id);
    if (b.status !== PastoralBookingStatus.PENDING) throw new ConflictException('Only a request that is still waiting can be passed on.');
    if (dto.toHostId === b.hostId) throw new BadRequestException('It’s already with that pastor.');

    const target = await this.prisma.pastorHost.findFirst({
      where: { id: dto.toHostId, tenantId: this.tenantId, active: true },
      include: { SessionTypes: { where: { active: true, archivedAt: null, jointWithHostId: null }, orderBy: { position: 'asc' } } },
    });
    if (!target) throw new NotFoundException('That pastor isn’t taking One-on-One sessions.');

    const duration = b.SessionType.durationMinutes;
    const type =
      target.SessionTypes.find((t) => t.durationMinutes === duration && (b.requesterType !== PastoralRequesterType.VISITOR || t.visitorsCanBook)) ??
      target.SessionTypes.find((t) => t.durationMinutes === duration) ??
      target.SessionTypes[0];
    if (!type) throw new BadRequestException(`${target.displayName} has no session types switched on yet.`);

    const date = localDateKey(b.startsAt);
    const open = await this.oneOnOne.computeOpenSlots(target.id, type.id, date, date, { excludeBookingId: b.id });
    const fits = open.some((d) => d.slots.some((s) => s.startsAt === b.startsAt.toISOString()));

    const updated = await this.prisma.pastoralBooking.update({
      where: { id },
      data: {
        hostId: target.id,
        coHostId: null,
        sessionTypeId: type.id,
        endsAt: new Date(b.startsAt.getTime() + type.durationMinutes * 60_000),
        assignedById: user.profileId,
        assignedAt: new Date(),
        pendingNudgeSentAt: null,
      },
      include: BOOKING_INCLUDE,
    });

    const note = [
      dto.note?.trim(),
      fits ? null : 'This time is outside your hours or clashes with something else, so please suggest another time.',
    ]
      .filter(Boolean)
      .join('\n\n');
    void this.notify.toHostSide(this.toNotify(updated), 'ASSIGNED', note || null);
    return { ...this.base(updated), fits };
  }

  async decline(user: AuthUser, hostId: string, id: string, dto: DecisionNoteDto) {
    const b = await this.loadForHost(user, hostId, id);
    if (b.status !== PastoralBookingStatus.PENDING && b.status !== PastoralBookingStatus.PROPOSED) {
      throw new ConflictException('This request has already been decided.');
    }
    const note = dto.note?.trim() || null;
    const updated = await this.prisma.pastoralBooking.update({
      where: { id },
      data: { status: PastoralBookingStatus.DECLINED, decidedAt: new Date(), decidedById: user.profileId, decisionNote: note },
      include: BOOKING_INCLUDE,
    });
    void this.notify.toRequester(this.toNotify(updated), 'DECLINED', note);
    return this.base(updated);
  }

  /** Suggest another time instead of the one asked for. The new time is held until the requester answers. */
  async propose(user: AuthUser, hostId: string, id: string, dto: ProposeTimeDto) {
    const b = await this.loadForHost(user, hostId, id);
    if (b.status !== PastoralBookingStatus.PENDING) throw new ConflictException('This request has already been decided.');
    const startsAt = new Date(dto.startsAt);
    if (startsAt.getTime() === b.startsAt.getTime()) throw new BadRequestException('That is the time they already asked for.');

    const note = dto.note?.trim() || null;
    await this.withFreshSlot(
      {
        hostId: b.hostId,
        sessionTypeId: b.sessionTypeId,
        startsAt,
        excludeBookingId: b.id,
        audience: b.requesterType === PastoralRequesterType.VISITOR ? 'VISITOR' : 'MEMBER',
      },
      (tx, endsAt) =>
        tx.pastoralBooking.update({
          where: { id },
          data: {
            status: PastoralBookingStatus.PROPOSED,
            anonymousIntake: false,
            proposedStartsAt: startsAt,
            proposedEndsAt: endsAt,
            decidedAt: new Date(),
            decidedById: user.profileId,
            decisionNote: note,
          },
        }),
    );
    const updated = await this.reload(id);
    void this.notify.toRequester(this.toNotify(updated), 'PROPOSED', note);
    return this.base(updated);
  }

  async cancelApproved(user: AuthUser, hostId: string, id: string, dto: DecisionNoteDto) {
    const b = await this.loadForHost(user, hostId, id);
    if (b.status !== PastoralBookingStatus.APPROVED || b.endsAt <= new Date()) {
      throw new ConflictException('Only an upcoming approved session can be cancelled.');
    }
    const note = dto.note?.trim() || null;
    const updated = await this.prisma.pastoralBooking.update({
      where: { id },
      data: { status: PastoralBookingStatus.CANCELLED, cancelledAt: new Date(), cancelledBy: 'HOST', cancelReason: note },
      include: BOOKING_INCLUDE,
    });
    if (b.googleEventId) void this.calendar.deleteEvent(b.Host.profileId, b.googleEventId);
    void this.notify.toRequester(this.toNotify(updated), 'CANCELLED_BY_HOST', note);
    return this.base(updated);
  }
}
