import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, type PrayerSignup, type PrayerSlot } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { NotificationEvents } from '../notifications/notification-events';
import {
  AdminCreatePrayerSignupDto,
  CreatePrayerSignupDto,
  MovePrayerSignupDto,
  SetSlotLeaderDto,
  UpdatePrayerWatchDto,
} from './dto/prayer-watch.dto';

/** The watch's default shape when none exists yet for this tenant. */
const DEFAULT_SLOTS = [
  { label: 'First Watch', startTime: '22:00', endTime: '00:00', position: 0 },
  { label: 'Second Watch', startTime: '00:00', endTime: '02:00', position: 1 },
  { label: 'Third Watch', startTime: '02:00', endTime: '04:00', position: 2 },
  { label: 'Fourth Watch', startTime: '04:00', endTime: '06:00', position: 3 },
];

/** A warm, specific confirmation — names the hour back to them so it feels
 * like a real commitment, not a generic "thanks for signing up" receipt. */
function buildSignupConfirmationText(fullName: string, startTime: string, endTime: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] || 'Friend';
  return [
    `Dear ${firstName},`,
    '',
    `You're in. Your hour on the Prayer Watch is ${startTime}–${endTime}.`,
    '',
    "That hour is yours to carry before the Lord. While you watch, others are holding the hours before and after you, so together the whole night is covered in prayer — your watch matters to the whole.",
    '',
    "Come ready. Set an alarm if you need to, keep your heart expectant, and watch unto prayer. He meets those who seek Him in the night.",
    '',
    'See you on the watch,',
    'Everlasting Hills Church',
  ].join('\n');
}

@Injectable()
export class PrayerWatchService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
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

  async createSignup(dto: CreatePrayerSignupDto | AdminCreatePrayerSignupDto) {
    let result: { signup: PrayerSignup; slot: PrayerSlot };
    try {
      result = await this.prisma.$transaction(
        async (tx) => {
          const slot = await tx.prayerSlot.findFirst({ where: { id: dto.slotId, tenantId: this.tenantId } });
          if (!slot) throw new NotFoundException('Slot not found');

          const phone = dto.phone.trim();
          const existingByPhone = await tx.prayerSignup.findFirst({
            where: { tenantId: this.tenantId, watchId: slot.watchId, phone, status: 'CONFIRMED' },
          });
          if (existingByPhone) {
            throw new ConflictException('This phone number already has an active sign-up for this watch.');
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
    this.events.emit(NotificationEvents.SendEmail, {
      to: result.signup.email,
      subject: `Your Prayer Watch hour: ${result.slot.startTime}–${result.slot.endTime}`,
      text: buildSignupConfirmationText(result.signup.fullName, result.slot.startTime, result.slot.endTime),
      tag: 'prayer-watch-signup',
    });

    return result;
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
      if (dto.title !== undefined || dto.watchDate !== undefined) {
        await tx.prayerWatch.update({
          where: { id: watch.id },
          data: {
            ...(dto.title !== undefined && { title: dto.title.trim() }),
            ...(dto.watchDate !== undefined && { watchDate: new Date(dto.watchDate) }),
          },
        });
      }
      if (dto.slots) {
        for (const s of dto.slots) {
          await tx.prayerSlot.updateMany({
            where: { id: s.id, tenantId: this.tenantId, watchId: watch.id },
            data: { capacity: s.capacity },
          });
        }
      }
    });

    return this.getAdminView();
  }
}
