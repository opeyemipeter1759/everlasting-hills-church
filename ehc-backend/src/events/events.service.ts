import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import slugify from 'slugify';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import type { CreateEventRsvpDto } from './dto/event-rsvp.dto';

/**
 * Church events: admin-managed CRUD + public reads + public RSVP capture.
 *
 * Mirrors the testimonials/sermons modules — tenant scope applied on every query,
 * string ids via randomUUID, publishedAt stamped on the DRAFT→PUBLISHED transition.
 */
@Injectable()
export class EventsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Fields returned to the public — keeps drafts' internal bits out of summaries. */
  private static readonly SUMMARY_SELECT = {
    id: true,
    slug: true,
    title: true,
    tagline: true,
    startAt: true,
    endAt: true,
    venueName: true,
    flyerImageUrl: true,
    featured: true,
    customPath: true,
  } satisfies Prisma.EventSelect;

  /** Public: published events, featured first then soonest. */
  async listPublished() {
    return this.prisma.event.findMany({
      where: { tenantId: this.tenantId, status: EventStatus.PUBLISHED },
      orderBy: [{ featured: 'desc' }, { startAt: 'asc' }],
      select: EventsService.SUMMARY_SELECT,
    });
  }

  /** Public: a single published event by slug. */
  async getBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: { tenantId: this.tenantId, slug, status: EventStatus.PUBLISHED },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  /** Admin: all events including drafts, with RSVP counts. */
  async listAll() {
    return this.prisma.event.findMany({
      where: { tenantId: this.tenantId },
      orderBy: [{ startAt: 'desc' }],
      include: { _count: { select: { Rsvps: true } } },
    });
  }

  /** Fields the calendar grid needs — chips render a title, a time and a status dot. */
  private static readonly CALENDAR_SELECT = {
    id: true,
    slug: true,
    title: true,
    startAt: true,
    endAt: true,
    status: true,
    featured: true,
    venueName: true,
  } satisfies Prisma.EventSelect;

  /**
   * Admin: every event overlapping [from, to], drafts included.
   *
   * An event occupies [startAt, endAt ?? startAt], so it overlaps the window when it
   * starts on or before `to` and ends on or after `from`. Single-instant events (endAt
   * null) are matched on startAt instead, which is why the OR is needed: `endAt: {gte}`
   * alone would silently drop every event without an end time.
   */
  async listForCalendar(from: Date, to: Date) {
    if (from > to) {
      throw new BadRequestException('`from` must be on or before `to`.');
    }
    return this.prisma.event.findMany({
      where: {
        tenantId: this.tenantId,
        startAt: { lte: to },
        OR: [{ endAt: { gte: from } }, { endAt: null, startAt: { gte: from } }],
      },
      orderBy: [{ startAt: 'asc' }],
      select: EventsService.CALENDAR_SELECT,
    });
  }

  /**
   * Admin: the dashboard calendar summary — the next few published events plus the
   * counts the superadmin home shows. `now` is passed in so the window boundaries and
   * the "upcoming" cutoff come from one clock reading rather than drifting apart.
   */
  async calendarSummary(now: Date = new Date()) {
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const published = { tenantId: this.tenantId, status: EventStatus.PUBLISHED };

    const [upcoming, thisWeek, thisMonth, drafts] = await Promise.all([
      this.prisma.event.findMany({
        where: { ...published, startAt: { gte: now } },
        orderBy: [{ startAt: 'asc' }],
        take: 5,
        select: EventsService.CALENDAR_SELECT,
      }),
      this.prisma.event.count({
        where: { ...published, startAt: { gte: startOfWeek, lt: endOfWeek } },
      }),
      this.prisma.event.count({
        where: { ...published, startAt: { gte: startOfMonth, lt: startOfNextMonth } },
      }),
      this.prisma.event.count({
        where: { tenantId: this.tenantId, status: EventStatus.DRAFT },
      }),
    ]);

    return { upcoming, counts: { thisWeek, thisMonth, drafts } };
  }

  async getById(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, tenantId: this.tenantId },
      include: { _count: { select: { Rsvps: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async create(data: CreateEventDto) {
    const now = new Date();
    const status = data.status ?? EventStatus.DRAFT;
    const slug = await this.uniqueSlug(data.slug || data.title);

    return this.prisma.event.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        slug,
        title: data.title,
        tagline: data.tagline ?? null,
        description: data.description ?? null,
        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : null,
        venueName: data.venueName ?? null,
        venueAddress: data.venueAddress ?? null,
        mapsLink: data.mapsLink ?? null,
        flyerImageUrl: data.flyerImageUrl ?? null,
        hostName: data.hostName ?? null,
        guestMinister: data.guestMinister ?? null,
        contactPhone: data.contactPhone ?? null,
        contactEmail: data.contactEmail ?? null,
        contactWhatsapp: data.contactWhatsapp ?? null,
        status,
        featured: data.featured ?? false,
        rsvpEnabled: data.rsvpEnabled ?? true,
        capacity: data.capacity ?? null,
        customPath: data.customPath ?? null,
        order: data.order ?? 0,
        publishedAt: status === EventStatus.PUBLISHED ? now : null,
        updatedAt: now,
      },
    });
  }

  async update(id: string, data: UpdateEventDto) {
    const current = await this.getById(id); // 404 if foreign tenant
    const nowPublishing =
      data.status === EventStatus.PUBLISHED && current.status !== EventStatus.PUBLISHED;

    const slug =
      data.slug && data.slug !== current.slug
        ? await this.uniqueSlug(data.slug, id)
        : undefined;

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(slug && { slug }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.tagline !== undefined && { tagline: data.tagline }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startAt !== undefined && { startAt: new Date(data.startAt) }),
        ...(data.endAt !== undefined && { endAt: data.endAt ? new Date(data.endAt) : null }),
        ...(data.venueName !== undefined && { venueName: data.venueName }),
        ...(data.venueAddress !== undefined && { venueAddress: data.venueAddress }),
        ...(data.mapsLink !== undefined && { mapsLink: data.mapsLink }),
        ...(data.flyerImageUrl !== undefined && { flyerImageUrl: data.flyerImageUrl }),
        ...(data.hostName !== undefined && { hostName: data.hostName }),
        ...(data.guestMinister !== undefined && { guestMinister: data.guestMinister }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
        ...(data.contactWhatsapp !== undefined && { contactWhatsapp: data.contactWhatsapp }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.rsvpEnabled !== undefined && { rsvpEnabled: data.rsvpEnabled }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.customPath !== undefined && { customPath: data.customPath }),
        ...(data.order !== undefined && { order: data.order }),
        ...(nowPublishing && { publishedAt: new Date() }),
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    const result = await this.prisma.event.deleteMany({
      where: { id, tenantId: this.tenantId },
    });
    if (result.count === 0) throw new NotFoundException('Event not found');
    return { id, deleted: true };
  }

  // ── RSVP ────────────────────────────────────────────────────────────────────

  /** Public: capture an RSVP against a published, RSVP-enabled event. */
  async createRsvp(slug: string, data: CreateEventRsvpDto) {
    const event = await this.getBySlug(slug); // 404 if not published
    const attendees = data.attendees ?? 1;
    await this.assertRsvpAllowed(event.id, event.rsvpEnabled, event.capacity, attendees);

    await this.saveRsvp(event.id, {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone ?? null,
      attendees,
      message: data.message ?? null,
    });

    return { success: true, message: 'RSVP received' };
  }

  /**
   * Logged-in member RSVP: same flow as the public form, but the name/email/phone come
   * from their own Member record instead of being typed in again — we already have them.
   */
  async createRsvpAsMember(slug: string, profileId: string) {
    const event = await this.getBySlug(slug); // 404 if not published
    const member = await this.prisma.member.findFirst({
      where: { tenantId: this.tenantId, profileId },
    });
    if (!member) throw new NotFoundException('Member record not found for current user');

    await this.assertRsvpAllowed(event.id, event.rsvpEnabled, event.capacity, 1);

    await this.saveRsvp(event.id, {
      fullName: `${member.firstName} ${member.lastName}`.trim(),
      email: member.email ?? '',
      phone: member.phone,
      attendees: 1,
      message: null,
    });

    return { success: true, message: 'RSVP received' };
  }

  private async assertRsvpAllowed(
    eventId: string,
    rsvpEnabled: boolean,
    capacity: number | null,
    attendees: number,
  ) {
    if (!rsvpEnabled) {
      throw new BadRequestException('RSVPs are closed for this event');
    }
    if (capacity != null) {
      const agg = await this.prisma.eventRsvp.aggregate({
        where: { tenantId: this.tenantId, eventId },
        _sum: { attendees: true },
      });
      const reserved = agg._sum.attendees ?? 0;
      if (reserved + attendees > capacity) {
        throw new BadRequestException('This event is fully booked');
      }
    }
  }

  private async saveRsvp(
    eventId: string,
    data: { fullName: string; email: string; phone: string | null; attendees: number; message: string | null },
  ) {
    return this.prisma.eventRsvp.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        eventId,
        ...data,
      },
    });
  }

  /** Admin: RSVPs for one event (most recent first), flagged with whether each is an existing member. */
  async listRsvps(eventId: string) {
    await this.getById(eventId); // 404 if foreign tenant
    const rsvps = await this.prisma.eventRsvp.findMany({
      where: { tenantId: this.tenantId, eventId },
      orderBy: { createdAt: 'desc' },
    });

    const emails = [...new Set(rsvps.map((r) => r.email))];
    const members = emails.length
      ? await this.prisma.member.findMany({
          where: {
            tenantId: this.tenantId,
            OR: emails.map((email) => ({ email: { equals: email, mode: 'insensitive' as const } })),
          },
          select: { email: true },
        })
      : [];
    const memberEmails = new Set(members.map((m) => m.email!.toLowerCase()));

    return rsvps.map((r) => ({ ...r, isMember: memberEmails.has(r.email.toLowerCase()) }));
  }

  /** Admin: mark an RSVP as checked in (present) or not, at the door on event day. */
  async setRsvpCheckedIn(eventId: string, rsvpId: string, checkedIn: boolean) {
    const rsvp = await this.prisma.eventRsvp.findFirst({
      where: { id: rsvpId, eventId, tenantId: this.tenantId },
    });
    if (!rsvp) throw new NotFoundException('RSVP not found');
    return this.prisma.eventRsvp.update({
      where: { id: rsvpId },
      data: { checkedIn, checkedInAt: checkedIn ? new Date() : null },
    });
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  /** Tenant-unique slug; appends a short suffix on collision. */
  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    const root =
      slugify(base, { lower: true, strict: true }) || randomUUID().slice(0, 8);
    let candidate = root;
    for (let i = 0; i < 5; i++) {
      const clash = await this.prisma.event.findFirst({
        where: {
          tenantId: this.tenantId,
          slug: candidate,
          ...(excludeId && { id: { not: excludeId } }),
        },
        select: { id: true },
      });
      if (!clash) return candidate;
      candidate = `${root}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return `${root}-${randomUUID().slice(0, 6)}`;
  }
}
