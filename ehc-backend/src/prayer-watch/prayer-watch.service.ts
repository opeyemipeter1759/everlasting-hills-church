import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, PrayerSignupStatus, type PrayerSignup, type PrayerSlot } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { NotificationEvents } from '../notifications/notification-events';
import { IcsBuilderService } from '../calendar/services/ics-builder.service';
import { buildPrayerWatchFamilyChangeDecidedEmail } from '../notifications/templates/prayer-watch-family-change-decided.email';
import { buildPrayerWatchSignupApprovedEmail } from '../notifications/templates/prayer-watch-signup-approved.email';
import { buildPrayerWatchSignupDeclinedEmail } from '../notifications/templates/prayer-watch-signup-declined.email';
import { buildPrayerWatchSignupPendingEmail } from '../notifications/templates/prayer-watch-signup-pending.email';
import {
  AdminCreatePrayerSignupDto,
  CreatePrayerSignupDto,
  CreatePrayerWatchReflectionDto,
  DecideFamilyChangeDto,
  DecideSignupDto,
  MovePrayerSignupDto,
  RequestFamilyChangeDto,
  SetSlotLeaderDto,
  UpdatePrayerWatchDto,
} from './dto/prayer-watch.dto';
import { slotDateTime } from './prayer-watch.util';

/** The watch's default shape when none exists yet for this tenant. */
/** Capacity is generous on purpose — many people pray the same hour together,
 * it isn't a scarce resource like a serving roster slot. */
const DEFAULT_SLOT_CAPACITY = 100;

const DEFAULT_SLOTS = [
  { label: 'First Watch', startTime: '22:00', endTime: '00:00', position: 0, capacity: DEFAULT_SLOT_CAPACITY },
  { label: 'Second Watch', startTime: '00:00', endTime: '02:00', position: 1, capacity: DEFAULT_SLOT_CAPACITY },
  { label: 'Third Watch', startTime: '02:00', endTime: '04:00', position: 2, capacity: DEFAULT_SLOT_CAPACITY },
  { label: 'Fourth Watch', startTime: '04:00', endTime: '06:00', position: 3, capacity: DEFAULT_SLOT_CAPACITY },
];

/** Sign-ups and change requests the member may have left open at ("PENDING"/"CONFIRMED"). */
const ACTIVE_SIGNUP_STATUSES: PrayerSignupStatus[] = [PrayerSignupStatus.PENDING, PrayerSignupStatus.CONFIRMED];

@Injectable()
export class PrayerWatchService {
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly ics: IcsBuilderService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) ?? 'https://www.everlastinghills.church').replace(/\/$/, '');
  }

  /** Where every Prayer Watch email's call to action points. */
  private get pageUrl(): string {
    return `${this.appUrl}/dashboard/prayer-watch`;
  }

  /** The single active watch for this tenant — created with default slots on first access. */
  private async getOrCreateWatch() {
    const existing = await this.prisma.prayerWatch.findFirst({
      where: { tenantId: this.tenantId },
      orderBy: { watchDate: 'desc' },
      include: { Slots: { orderBy: { position: 'asc' } } },
    });
    if (existing) return existing;

    const watchId = randomUUID();
    await this.prisma.prayerWatch.create({
      data: {
        id: watchId,
        tenantId: this.tenantId,
        title: 'Prayer Watch',
        watchDate: new Date(new Date().toISOString().slice(0, 10)),
        Slots: {
          create: DEFAULT_SLOTS.map((s) => ({ id: randomUUID(), tenantId: this.tenantId, ...s })),
        },
      },
    });
    return this.prisma.prayerWatch.findFirstOrThrow({
      where: { id: watchId },
      include: { Slots: { orderBy: { position: 'asc' } } },
    });
  }

  // ── Public ────────────────────────────────────────────────────────────────

  /** No names/phones — just the slots and how many spots are left. */
  async getPublicView() {
    const watch = await this.getOrCreateWatch();
    const counts = await this.prisma.prayerSignup.groupBy({
      by: ['slotId'],
      where: { watchId: watch.id, status: 'CONFIRMED' },
      _count: { _all: true },
    });
    const countBySlot = new Map(counts.map((c) => [c.slotId, c._count._all]));

    return {
      id: watch.id,
      title: watch.title,
      watchDate: watch.watchDate.toISOString().slice(0, 10),
      slots: watch.Slots.map((s) => ({
        id: s.id,
        label: s.label,
        startTime: s.startTime,
        endTime: s.endTime,
        capacity: s.capacity,
        spotsLeft: Math.max(0, s.capacity - (countBySlot.get(s.id) ?? 0)),
      })),
    };
  }

  async createSignup(dto: CreatePrayerSignupDto | AdminCreatePrayerSignupDto, profileId: string | null = null) {
    let result: { signup: PrayerSignup; slot: PrayerSlot };
    try {
      result = await this.prisma.$transaction(
        async (tx) => {
          const slot = await tx.prayerSlot.findFirst({ where: { id: dto.slotId, tenantId: this.tenantId } });
          if (!slot) throw new NotFoundException('Slot not found');

          const phone = dto.phone.trim();
          const existingByPhone = await tx.prayerSignup.findFirst({
            where: { tenantId: this.tenantId, watchId: slot.watchId, phone, status: { in: ACTIVE_SIGNUP_STATUSES } },
          });
          if (existingByPhone) {
            throw new ConflictException(
              existingByPhone.status === PrayerSignupStatus.PENDING
                ? 'This phone number already has a sign-up waiting for approval for this watch.'
                : 'This phone number already has an active sign-up for this watch.',
            );
          }

          const confirmedCount = await tx.prayerSignup.count({ where: { slotId: slot.id, status: 'CONFIRMED' } });
          if (confirmedCount >= slot.capacity) {
            throw new ConflictException('This slot just filled up — please choose another.');
          }

          const signup = await tx.prayerSignup.create({
            data: {
              id: randomUUID(),
              tenantId: this.tenantId,
              slotId: slot.id,
              watchId: slot.watchId,
              fullName: dto.fullName.trim(),
              phone,
              email: dto.email.trim(),
              isWorker: dto.isWorker,
              profileId,
              status: PrayerSignupStatus.PENDING,
            },
          });

          return { signup, slot };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (err) {
      // P2034: write conflict/deadlock under Serializable isolation — exactly
      // the "two people take the last spot at once" race the slot-capacity
      // check above is meant to catch; a concurrent conflict here means it
      // genuinely needs a retry, not a bug.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
        throw new ConflictException('This slot just filled up — please try again.');
      }
      throw err;
    }

    // Fire-and-forget — same pattern as every other public-form confirmation
    // in this app (see FormsEmailDispatchService). Never blocks the response.
    // Every sign-up now waits for an admin, so this says "received", not "you're in".
    this.events.emit(
      NotificationEvents.SendEmail,
      buildPrayerWatchSignupPendingEmail({
        to: result.signup.email,
        fullName: result.signup.fullName,
        slotLabel: result.slot.label,
        slotTime: `${result.slot.startTime}–${result.slot.endTime}`,
        url: this.pageUrl,
      }),
    );

    return result;
  }

  // ── Self-service (authenticated member, own sign-up only) ──────────────────

  private async loadOwnSignup(id: string, profileId: string) {
    const signup = await this.prisma.prayerSignup.findFirst({
      where: { id, tenantId: this.tenantId, status: 'CONFIRMED' },
    });
    if (!signup) throw new NotFoundException('Sign-up not found');
    if (signup.profileId !== profileId) throw new ForbiddenException("That isn't your sign-up");
    return signup;
  }

  /** The member's own sign-up for the current watch, if any (pending or confirmed), plus any pending request to change it. */
  async getMySignup(profileId: string) {
    const watch = await this.getOrCreateWatch();
    const signup = await this.prisma.prayerSignup.findFirst({
      where: { tenantId: this.tenantId, watchId: watch.id, profileId, status: { in: ACTIVE_SIGNUP_STATUSES } },
    });
    if (!signup) return null;
    const slot = watch.Slots.find((s) => s.id === signup.slotId);
    if (!slot) return null;

    const confirmed = signup.status === PrayerSignupStatus.CONFIRMED;
    const pending = confirmed
      ? await this.prisma.prayerFamilyChangeRequest.findFirst({
          where: { signupId: signup.id, status: 'PENDING' },
          include: { ToSlot: true },
        })
      : null;

    return {
      signup: this.toSignupSummary(signup),
      // Links are withheld until confirmed — nothing to join yet.
      slot: { id: slot.id, label: slot.label, startTime: slot.startTime, endTime: slot.endTime, capacity: slot.capacity, whatsappLink: confirmed ? slot.whatsappLink : null },
      telegramLink: confirmed ? watch.telegramLink : null,
      pendingFamilyChangeRequest: pending
        ? {
            id: pending.id,
            toSlotId: pending.toSlotId,
            toSlotLabel: pending.ToSlot.label,
            toSlotTime: `${pending.ToSlot.startTime}–${pending.ToSlot.endTime}`,
            reason: pending.reason,
            createdAt: pending.createdAt.toISOString(),
          }
        : null,
    };
  }

  /**
   * Requests a move to a different Prayer Watchmen Family — reviewed by an
   * admin rather than applied immediately, since members are expected to
   * stay committed to one family and only change it deliberately.
   */
  async requestFamilyChange(id: string, profileId: string, dto: RequestFamilyChangeDto) {
    const signup = await this.loadOwnSignup(id, profileId);
    if (dto.toSlotId === signup.slotId) {
      throw new ConflictException("That's already your Prayer Watchmen Family.");
    }

    const toSlot = await this.prisma.prayerSlot.findFirst({ where: { id: dto.toSlotId, tenantId: this.tenantId, watchId: signup.watchId } });
    if (!toSlot) throw new NotFoundException('Slot not found');

    const existingPending = await this.prisma.prayerFamilyChangeRequest.findFirst({
      where: { signupId: signup.id, status: 'PENDING' },
    });
    if (existingPending) {
      throw new ConflictException('You already have a pending request to change your Prayer Watchmen Family.');
    }

    const request = await this.prisma.prayerFamilyChangeRequest.create({
      data: { id: randomUUID(), tenantId: this.tenantId, signupId: signup.id, toSlotId: toSlot.id, reason: dto.reason?.trim() || null },
    });
    return {
      id: request.id,
      toSlotId: toSlot.id,
      toSlotLabel: toSlot.label,
      toSlotTime: `${toSlot.startTime}–${toSlot.endTime}`,
      reason: request.reason,
      createdAt: request.createdAt.toISOString(),
    };
  }

  /** First names only, for the shared-vigil feel — never phone/email. */
  async getSlotCompanions(slotId: string, profileId: string | null) {
    const signups = await this.prisma.prayerSignup.findMany({
      where: { tenantId: this.tenantId, slotId, status: 'CONFIRMED' },
      select: { profileId: true, fullName: true },
      orderBy: { createdAt: 'asc' },
    });
    const firstNames = signups
      .filter((s) => s.profileId !== profileId)
      .map((s) => s.fullName.trim().split(/\s+/)[0])
      .filter((n): n is string => Boolean(n));
    return { count: firstNames.length, firstNames };
  }

  /** Past watches this member has kept, most recent first, with every reflection they've left on each. */
  async getMyHistory(profileId: string) {
    const signups = await this.prisma.prayerSignup.findMany({
      where: { tenantId: this.tenantId, profileId, status: 'CONFIRMED' },
      include: { Slot: { include: { Watch: true } }, Reflections: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    return signups
      .filter((s) => slotDateTime(s.Slot.Watch.watchDate, s.Slot.endTime) < now)
      .map((s) => ({
        signupId: s.id,
        watchTitle: s.Slot.Watch.title,
        watchDate: s.Slot.Watch.watchDate.toISOString().slice(0, 10),
        slotLabel: s.Slot.label,
        slotTime: `${s.Slot.startTime}–${s.Slot.endTime}`,
        reflections: s.Reflections.map((r) => ({ id: r.id, body: r.body, createdAt: r.createdAt.toISOString() })),
      }));
  }

  /** Adds a new dated entry — the watch is ongoing, so a member may log several over time rather than overwrite the last. */
  async addReflection(signupId: string, profileId: string, dto: CreatePrayerWatchReflectionDto) {
    const signup = await this.loadOwnSignup(signupId, profileId);
    const slot = await this.prisma.prayerSlot.findFirst({
      where: { id: signup.slotId, tenantId: this.tenantId },
      include: { Watch: true },
    });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slotDateTime(slot.Watch.watchDate, slot.endTime) > new Date()) {
      throw new ConflictException("You can share a reflection once your watch hour has passed.");
    }

    const body = dto.body.trim();
    const reflection = await this.prisma.prayerWatchReflection.create({
      data: { id: randomUUID(), tenantId: this.tenantId, signupId, profileId, body },
    });
    return { id: reflection.id, signupId, body, createdAt: reflection.createdAt.toISOString() };
  }

  /** A single .ics event for the member's own chosen hour, with a 30-minute alarm. */
  async buildSignupIcs(signupId: string, profileId: string) {
    const signup = await this.loadOwnSignup(signupId, profileId);
    const slot = await this.prisma.prayerSlot.findFirst({
      where: { id: signup.slotId, tenantId: this.tenantId },
      include: { Watch: true },
    });
    if (!slot) throw new NotFoundException('Slot not found');

    const calendar = this.ics.createCalendar({ name: slot.Watch.title });
    this.ics.addEvent(calendar, {
      uid: `prayer-watch-signup-${signup.id}@everlastinghills`,
      summary: `Prayer Watch: ${slot.label}`,
      description: 'Your hour on the overnight Prayer Watch.',
      start: slotDateTime(slot.Watch.watchDate, slot.startTime),
      end: slotDateTime(slot.Watch.watchDate, slot.endTime),
      alarmMinutesBefore: 30,
    });
    return { filename: `prayer-watch-${slot.startTime.replace(':', '')}.ics`, body: this.ics.toString(calendar) };
  }

  private toSignupSummary(s: PrayerSignup) {
    return { id: s.id, fullName: s.fullName, phone: s.phone, email: s.email, isWorker: s.isWorker, status: s.status, createdAt: s.createdAt.toISOString() };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async getAdminView() {
    const watch = await this.getOrCreateWatch();
    const signups = await this.prisma.prayerSignup.findMany({
      where: { watchId: watch.id },
      orderBy: { createdAt: 'asc' },
    });
    const bySlot = new Map<string, typeof signups>();
    for (const s of signups) {
      if (!bySlot.has(s.slotId)) bySlot.set(s.slotId, []);
      bySlot.get(s.slotId)!.push(s);
    }

    return {
      id: watch.id,
      title: watch.title,
      watchDate: watch.watchDate.toISOString().slice(0, 10),
      telegramLink: watch.telegramLink,
      slots: watch.Slots.map((s) => {
        const slotSignups = (bySlot.get(s.id) ?? []).filter((x) => x.status === 'CONFIRMED');
        return {
          id: s.id,
          label: s.label,
          startTime: s.startTime,
          endTime: s.endTime,
          capacity: s.capacity,
          spotsLeft: Math.max(0, s.capacity - slotSignups.length),
          leaderId: s.leaderId,
          whatsappLink: s.whatsappLink,
          signups: slotSignups.map((x) => ({
            id: x.id,
            fullName: x.fullName,
            phone: x.phone,
            email: x.email,
            isWorker: x.isWorker,
            createdAt: x.createdAt.toISOString(),
          })),
        };
      }),
    };
  }

  /** Flat, searchable list for the admin table — every active sign-up, newest first. */
  async listSignups() {
    const watch = await this.getOrCreateWatch();
    const slotById = new Map(watch.Slots.map((s) => [s.id, s]));
    const leaderIds = new Set(watch.Slots.map((s) => s.leaderId).filter((id): id is string => Boolean(id)));
    const signups = await this.prisma.prayerSignup.findMany({
      where: { watchId: watch.id, status: 'CONFIRMED' },
      orderBy: { createdAt: 'desc' },
    });
    return signups.map((s) => {
      const slot = slotById.get(s.slotId);
      return {
        id: s.id,
        fullName: s.fullName,
        phone: s.phone,
        email: s.email,
        isWorker: s.isWorker,
        isLeader: leaderIds.has(s.id),
        createdAt: s.createdAt.toISOString(),
        slotId: s.slotId,
        slotLabel: slot?.label ?? '',
        slotTime: slot ? `${slot.startTime}–${slot.endTime}` : '',
      };
    });
  }

  /** Sign-ups waiting on an admin, oldest first so no one is left at the bottom. */
  async listPendingSignups() {
    const watch = await this.getOrCreateWatch();
    const slotById = new Map(watch.Slots.map((s) => [s.id, s]));
    const signups = await this.prisma.prayerSignup.findMany({
      where: { watchId: watch.id, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
    return signups.map((s) => {
      const slot = slotById.get(s.slotId);
      return {
        id: s.id,
        fullName: s.fullName,
        phone: s.phone,
        email: s.email,
        isWorker: s.isWorker,
        createdAt: s.createdAt.toISOString(),
        slotId: s.slotId,
        slotLabel: slot?.label ?? '',
        slotTime: slot ? `${slot.startTime}–${slot.endTime}` : '',
      };
    });
  }

  /** Approving confirms the sign-up and reveals the WhatsApp + Telegram links; declining just tells them why. Either way, they're emailed. */
  async decideSignup(actorProfileId: string, id: string, approve: boolean, dto: DecideSignupDto) {
    const signup = await this.prisma.prayerSignup.findFirst({
      where: { id, tenantId: this.tenantId, status: 'PENDING' },
      include: { Slot: { include: { Watch: true } } },
    });
    if (!signup) throw new NotFoundException('Sign-up not found, or already decided');

    await this.prisma.prayerSignup.update({
      where: { id },
      data: { status: approve ? PrayerSignupStatus.CONFIRMED : PrayerSignupStatus.REMOVED, decidedAt: new Date(), decidedById: actorProfileId },
    });

    const slotTime = `${signup.Slot.startTime}–${signup.Slot.endTime}`;
    this.events.emit(
      NotificationEvents.SendEmail,
      approve
        ? buildPrayerWatchSignupApprovedEmail({
            to: signup.email,
            fullName: signup.fullName,
            slotLabel: signup.Slot.label,
            slotTime,
            whatsappLink: signup.Slot.whatsappLink,
            telegramLink: signup.Slot.Watch.telegramLink,
            url: this.pageUrl,
          })
        : buildPrayerWatchSignupDeclinedEmail({ to: signup.email, fullName: signup.fullName, note: dto.note?.trim() || null, url: this.pageUrl }),
    );

    return { id, status: approve ? 'CONFIRMED' : 'REMOVED' };
  }

  /** What members sensed God say during their watch hour — across every watch, newest first. */
  async listReflections() {
    const reflections = await this.prisma.prayerWatchReflection.findMany({
      where: { tenantId: this.tenantId },
      include: { Signup: { include: { Slot: { include: { Watch: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return reflections.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      fullName: r.Signup.fullName,
      watchTitle: r.Signup.Slot.Watch.title,
      watchDate: r.Signup.Slot.Watch.watchDate.toISOString().slice(0, 10),
      slotLabel: r.Signup.Slot.label,
      slotTime: `${r.Signup.Slot.startTime}–${r.Signup.Slot.endTime}`,
    }));
  }

  async removeReflection(id: string) {
    const result = await this.prisma.prayerWatchReflection.deleteMany({ where: { id, tenantId: this.tenantId } });
    if (result.count === 0) throw new NotFoundException('Reflection not found');
    return { id, removed: true };
  }

  /** Requests to change Prayer Watchmen Family, newest first. */
  async listFamilyChangeRequests(filter: 'PENDING' | 'DECIDED' = 'PENDING') {
    const requests = await this.prisma.prayerFamilyChangeRequest.findMany({
      where: {
        tenantId: this.tenantId,
        ...(filter === 'PENDING' ? { status: 'PENDING' } : { status: { in: ['APPROVED', 'DECLINED'] } }),
      },
      include: { Signup: { include: { Slot: true } }, ToSlot: true },
      orderBy: filter === 'PENDING' ? { createdAt: 'asc' } : { decidedAt: 'desc' },
    });
    return requests.map((r) => ({
      id: r.id,
      status: r.status,
      fullName: r.Signup.fullName,
      fromSlotLabel: r.Signup.Slot.label,
      fromSlotTime: `${r.Signup.Slot.startTime}–${r.Signup.Slot.endTime}`,
      toSlotLabel: r.ToSlot.label,
      toSlotTime: `${r.ToSlot.startTime}–${r.ToSlot.endTime}`,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
      decidedAt: r.decidedAt?.toISOString() ?? null,
    }));
  }

  /** Approving actually performs the move; declining just records why. Either way, the member is emailed. */
  async decideFamilyChange(actorProfileId: string, id: string, approve: boolean, dto: DecideFamilyChangeDto) {
    const request = await this.prisma.prayerFamilyChangeRequest.findFirst({
      where: { id, tenantId: this.tenantId },
      include: { Signup: true, ToSlot: true },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING') throw new ConflictException('That request has already been decided');

    if (approve) {
      await this.moveSignup(request.signupId, { slotId: request.toSlotId });
    }

    await this.prisma.prayerFamilyChangeRequest.update({
      where: { id },
      data: { status: approve ? 'APPROVED' : 'DECLINED', decidedAt: new Date(), decidedById: actorProfileId },
    });

    this.events.emit(
      NotificationEvents.SendEmail,
      buildPrayerWatchFamilyChangeDecidedEmail({
        to: request.Signup.email,
        fullName: request.Signup.fullName,
        toSlotLabel: request.ToSlot.label,
        toSlotTime: `${request.ToSlot.startTime}–${request.ToSlot.endTime}`,
        approved: approve,
        note: dto.note,
        url: this.pageUrl,
      }),
    );

    return { id, status: approve ? 'APPROVED' : 'DECLINED' };
  }

  async removeSignup(id: string) {
    const result = await this.prisma.prayerSignup.updateMany({
      where: { id, tenantId: this.tenantId },
      data: { status: 'REMOVED' },
    });
    if (result.count === 0) throw new NotFoundException('Sign-up not found');
    return { id, removed: true };
  }

  async moveSignup(id: string, dto: MovePrayerSignupDto) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const signup = await tx.prayerSignup.findFirst({ where: { id, tenantId: this.tenantId, status: 'CONFIRMED' } });
          if (!signup) throw new NotFoundException('Sign-up not found');

          const destination = await tx.prayerSlot.findFirst({ where: { id: dto.slotId, tenantId: this.tenantId, watchId: signup.watchId } });
          if (!destination) throw new NotFoundException('Slot not found');

          if (destination.id !== signup.slotId) {
            const confirmedCount = await tx.prayerSignup.count({ where: { slotId: destination.id, status: 'CONFIRMED' } });
            if (confirmedCount >= destination.capacity) throw new ConflictException('That slot is full.');
          }

          return tx.prayerSignup.update({ where: { id }, data: { slotId: destination.id } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
        throw new ConflictException('That slot just filled up — please try again.');
      }
      throw err;
    }
  }

  /** The leader must be one of that slot's own sign-ups — not an arbitrary person. */
  async setSlotLeader(slotId: string, dto: SetSlotLeaderDto) {
    const slot = await this.prisma.prayerSlot.findFirst({ where: { id: slotId, tenantId: this.tenantId } });
    if (!slot) throw new NotFoundException('Slot not found');

    const signupId = dto.signupId ?? null;
    if (signupId) {
      const signup = await this.prisma.prayerSignup.findFirst({
        where: { id: signupId, tenantId: this.tenantId, slotId, status: 'CONFIRMED' },
      });
      if (!signup) throw new NotFoundException("That sign-up isn't in this slot");
    }

    await this.prisma.prayerSlot.update({ where: { id: slotId }, data: { leaderId: signupId } });
    return this.getAdminView();
  }

  async updateWatch(dto: UpdatePrayerWatchDto) {
    const watch = await this.getOrCreateWatch();

    await this.prisma.$transaction(async (tx) => {
      if (dto.title !== undefined || dto.watchDate !== undefined || dto.telegramLink !== undefined) {
        await tx.prayerWatch.update({
          where: { id: watch.id },
          data: {
            ...(dto.title !== undefined && { title: dto.title.trim() }),
            ...(dto.watchDate !== undefined && { watchDate: new Date(dto.watchDate) }),
            ...(dto.telegramLink !== undefined && { telegramLink: dto.telegramLink.trim() || null }),
          },
        });
      }
      if (dto.slots) {
        for (const s of dto.slots) {
          await tx.prayerSlot.updateMany({
            where: { id: s.id, tenantId: this.tenantId, watchId: watch.id },
            data: {
              ...(s.capacity !== undefined && { capacity: s.capacity }),
              ...(s.whatsappLink !== undefined && { whatsappLink: s.whatsappLink.trim() || null }),
            },
          });
        }
      }
    });

    return this.getAdminView();
  }
}
