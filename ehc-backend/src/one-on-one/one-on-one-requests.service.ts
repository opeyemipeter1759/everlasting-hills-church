import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PastoralBookingStatus, PastoralRequesterType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { GoogleTokenCipherService } from '../calendar/services/google-token-cipher.service';
import { CreateRequestDto, DecisionNoteDto, ProposeTimeDto } from './dto/one-on-one.dto';
import { OneOnOneService } from './one-on-one.service';
import { OneOnOneNotifyService, type NotifyBooking } from './one-on-one-notify.service';
import { localDateKey } from './slot-engine';

/** A member may cancel an approved session themself only this far ahead. */
const SELF_CANCEL_HOURS = 24;

const OPEN_FOR_MEMBER: PastoralBookingStatus[] = [
  PastoralBookingStatus.PENDING,
  PastoralBookingStatus.PROPOSED,
  PastoralBookingStatus.APPROVED,
];

const BOOKING_INCLUDE = {
  Host: { select: { displayName: true } },
  CoHost: { select: { displayName: true } },
  SessionType: { select: { name: true, durationMinutes: true } },
} satisfies Prisma.PastoralBookingInclude;

type BookingRow = Prisma.PastoralBookingGetPayload<{ include: typeof BOOKING_INCLUDE }>;

@Injectable()
export class OneOnOneRequestsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly oneOnOne: OneOnOneService,
    private readonly notify: OneOnOneNotifyService,
    private readonly cipher: GoogleTokenCipherService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  // ── Shapes ────────────────────────────────────────────────────────────────

  private toNotify(b: BookingRow): NotifyBooking {
    return {
      id: b.id,
      hostId: b.hostId,
      coHostId: b.coHostId,
      hostName: b.Host.displayName,
      coHostName: b.CoHost?.displayName ?? null,
      typeName: b.SessionType.name,
      memberProfileId: b.memberProfileId,
      requesterName: b.requesterName,
      requesterEmail: b.requesterEmail,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      proposedStartsAt: b.proposedStartsAt,
      proposedEndsAt: b.proposedEndsAt,
      format: b.format,
      topic: b.topic,
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

  private canMemberCancel(b: BookingRow, now = new Date()): boolean {
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

  /** Re-checks a start time against live availability inside a serializable transaction, then runs `write`. */
  private async withFreshSlot<T>(
    args: { hostId: string; sessionTypeId: string; startsAt: Date; excludeBookingId?: string },
    write: (tx: Prisma.TransactionClient, endsAt: Date) => Promise<T>,
  ): Promise<T> {
    const date = localDateKey(args.startsAt);
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const days = await this.oneOnOne.computeOpenSlots(args.hostId, args.sessionTypeId, date, date, {
            db: tx,
            excludeBookingId: args.excludeBookingId,
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

  // ── Members ───────────────────────────────────────────────────────────────

  async createMemberRequest(user: AuthUser, dto: CreateRequestDto) {
    if (!user.profileId) throw new ForbiddenException('No profile');
    const note = dto.note?.trim() || null;
    if (note && !this.cipher.isConfigured) {
      throw new BadRequestException("Private notes can't be stored securely right now. Send the request without a note.");
    }

    const open = await this.prisma.pastoralBooking.findFirst({
      where: { tenantId: this.tenantId, memberProfileId: user.profileId, status: { in: OPEN_FOR_MEMBER }, endsAt: { gt: new Date() } },
    });
    if (open) {
      throw new ConflictException('You already have a session requested or booked. You can request another once it has happened, or withdraw it first.');
    }

    const type = await this.prisma.pastorSessionType.findFirst({
      where: { id: dto.sessionTypeId, hostId: dto.hostId, active: true, Host: { active: true, tenantId: this.tenantId } },
    });
    if (!type) throw new NotFoundException('Session type not found');

    const member = await this.prisma.member.findFirst({
      where: { profileId: user.profileId },
      select: { firstName: true, lastName: true, email: true, phone: true },
    });
    const email = member?.email || user.email;
    const name = member ? `${member.firstName} ${member.lastName}`.trim() : user.email;
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
          requesterName: name,
          requesterEmail: email,
          requesterPhone: member?.phone ?? null,
          startsAt,
          endsAt,
          status: PastoralBookingStatus.PENDING,
          format: dto.format,
          topic: dto.topic,
          noteEncrypted: note ? this.cipher.encrypt(note) : null,
        },
      }),
    );

    const row = await this.prisma.pastoralBooking.findUniqueOrThrow({ where: { id }, include: BOOKING_INCLUDE });
    void this.notify.toRequester(this.toNotify(row), 'RECEIVED');
    void this.notify.toHostSide(this.toNotify(row), 'NEW');
    return { ...this.base(row), canCancel: true };
  }

  async listMine(user: AuthUser) {
    const rows = await this.prisma.pastoralBooking.findMany({
      where: { tenantId: this.tenantId, memberProfileId: user.profileId ?? '' },
      include: BOOKING_INCLUDE,
      orderBy: { startsAt: 'desc' },
      take: 50,
    });
    const now = new Date();
    return rows.map((b) => ({ ...this.base(b), canCancel: this.canMemberCancel(b, now) }));
  }

  private async loadMine(user: AuthUser, id: string): Promise<BookingRow> {
    const b = await this.prisma.pastoralBooking.findFirst({ where: { id, tenantId: this.tenantId }, include: BOOKING_INCLUDE });
    if (!b || b.memberProfileId !== user.profileId) throw new NotFoundException('Session not found');
    return b;
  }

  async cancelMine(user: AuthUser, id: string, dto: DecisionNoteDto) {
    const b = await this.loadMine(user, id);
    if (!this.canMemberCancel(b)) {
      throw new ConflictException(
        b.status === PastoralBookingStatus.APPROVED
          ? `Sessions can be cancelled here up to ${SELF_CANCEL_HOURS} hours before. Please contact the church office.`
          : 'This request can no longer be withdrawn.',
      );
    }
    const updated = await this.prisma.pastoralBooking.update({
      where: { id },
      data: { status: PastoralBookingStatus.CANCELLED, cancelledAt: new Date(), cancelledBy: 'REQUESTER', cancelReason: dto.note?.trim() || null },
      include: BOOKING_INCLUDE,
    });
    void this.notify.toHostSide(this.toNotify(updated), 'WITHDRAWN');
    return { ...this.base(updated), canCancel: false };
  }

  /** Accepting the pastor's suggested time books it: the pastor proposed it, so it needs no second approval. */
  async acceptProposal(user: AuthUser, id: string) {
    const b = await this.loadMine(user, id);
    if (b.status !== PastoralBookingStatus.PROPOSED || !b.proposedStartsAt || !b.proposedEndsAt) {
      throw new ConflictException('There is no suggested time to accept.');
    }
    if (b.proposedStartsAt <= new Date()) throw new ConflictException('That suggested time has passed. Please pick another.');

    const updated = await this.prisma.pastoralBooking.update({
      where: { id },
      data: {
        status: PastoralBookingStatus.APPROVED,
        startsAt: b.proposedStartsAt,
        endsAt: b.proposedEndsAt,
        proposedStartsAt: null,
        proposedEndsAt: null,
      },
      include: BOOKING_INCLUDE,
    });
    void this.notify.toHostSide(this.toNotify(updated), 'ACCEPTED_PROPOSAL');
    return { ...this.base(updated), canCancel: this.canMemberCancel(updated) };
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
      note: isOwner && b.hostId === hostId ? this.decryptNote(b) : null,
    });

    return {
      waiting: rows.filter((b) => b.status === PastoralBookingStatus.PENDING && b.startsAt > now).map(view),
      awaitingRequester: rows.filter((b) => b.status === PastoralBookingStatus.PROPOSED).map(view),
      upcoming: rows.filter((b) => b.status === PastoralBookingStatus.APPROVED && b.endsAt > now).map(view),
      recent: rows
        .filter((b) => !(b.status === PastoralBookingStatus.APPROVED && b.endsAt > now) && b.status !== PastoralBookingStatus.PENDING && b.status !== PastoralBookingStatus.PROPOSED)
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

  async approve(user: AuthUser, hostId: string, id: string, dto: DecisionNoteDto) {
    const b = await this.loadForHost(user, hostId, id);
    if (b.status !== PastoralBookingStatus.PENDING) throw new ConflictException('This request has already been decided.');
    if (b.startsAt <= new Date()) throw new ConflictException('This time has already passed.');

    const note = dto.note?.trim() || null;
    const updated = await this.prisma.pastoralBooking.update({
      where: { id },
      data: { status: PastoralBookingStatus.APPROVED, decidedAt: new Date(), decidedById: user.profileId, decisionNote: note },
      include: BOOKING_INCLUDE,
    });
    void this.notify.toRequester(this.toNotify(updated), 'APPROVED', note);
    return this.base(updated);
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
    await this.withFreshSlot({ hostId: b.hostId, sessionTypeId: b.sessionTypeId, startsAt, excludeBookingId: b.id }, (tx, endsAt) =>
      tx.pastoralBooking.update({
        where: { id },
        data: {
          status: PastoralBookingStatus.PROPOSED,
          proposedStartsAt: startsAt,
          proposedEndsAt: endsAt,
          decidedAt: new Date(),
          decidedById: user.profileId,
          decisionNote: note,
        },
      }),
    );
    const updated = await this.prisma.pastoralBooking.findUniqueOrThrow({ where: { id }, include: BOOKING_INCLUDE });
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
    void this.notify.toRequester(this.toNotify(updated), 'CANCELLED_BY_HOST', note);
    return this.base(updated);
  }
}
