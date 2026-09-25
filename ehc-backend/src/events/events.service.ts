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
import { CmsRevalidateService } from '../cms/services/cms-revalidate.service';
import { AnnouncementsService } from '../announcements/announcements.service';
import type { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import type { CreateEventRsvpDto } from './dto/event-rsvp.dto';
import { eventSectionInputSchema } from './schemas/event-section.schema';

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
    private readonly revalidate: CmsRevalidateService,
    private readonly announcements: AnnouncementsService,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Fields returned to the public — keeps drafts' internal bits out of summaries. */
  private static readonly SUMMARY_SELECT = {
    id: true,
    slug: true,
    title: true,
    tagline: true,
    theme: true,
    shortDescription: true,
    startAt: true,
    endAt: true,
    timezone: true,
    locationType: true,
    venueName: true,
    flyerImageUrl: true,
    coverImageUrl: true,
    heroImageUrl: true,
    socialImageUrl: true,
    liveUrl: true,
    registrationUrl: true,
    primaryCtaLabel: true,
    primaryCtaUrl: true,
    featured: true,
    customPath: true,
    rsvpEnabled: true,
    registrationRequired: true,
    Schedules: { orderBy: { sortOrder: 'asc' as const } },
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
      include: {
        Schedules: { orderBy: { sortOrder: 'asc' } },
        Sections: { where: { isVisible: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return {
      ...event,
      // A legacy/manual database write cannot smuggle an unvalidated section
      // into the public renderer. Invalid rows remain available to admins to fix.
      Sections: event.Sections.filter((section) =>
        eventSectionInputSchema.safeParse({ type: section.type, content: section.content }).success,
      ),
    };
  }

  /** Admin: all events including drafts, with RSVP counts. */
  async listAll() {
    return this.prisma.event.findMany({
      where: { tenantId: this.tenantId },
      orderBy: [{ startAt: 'desc' }],
      include: {
        Schedules: { orderBy: { sortOrder: 'asc' } },
        Sections: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { Rsvps: true } },
      },
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
      include: {
        Schedules: { orderBy: { sortOrder: 'asc' } },
        Sections: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { Rsvps: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async create(data: CreateEventDto) {
    this.validateEventWindow(data);
    const sections = this.validateSections(data.sections);
    const now = new Date();
    const status = data.status ?? EventStatus.DRAFT;
    const slug = await this.uniqueSlug(data.slug || data.title);
    const id = randomUUID();

    const event = await this.prisma.$transaction(async (tx) => {
      await tx.event.create({
        data: {
          id,
          tenantId: this.tenantId,
          slug,
          title: data.title,
          tagline: data.tagline ?? null,
          theme: data.theme ?? null,
          shortDescription: data.shortDescription ?? null,
          description: data.description ?? null,
          startAt: new Date(data.startAt),
          endAt: data.endAt ? new Date(data.endAt) : null,
          timezone: data.timezone ?? 'Africa/Lagos',
          locationType: data.locationType ?? 'PHYSICAL',
          venueName: data.venueName ?? null,
          venueAddress: data.venueAddress ?? null,
          mapsLink: data.mapsLink ?? null,
          flyerImageUrl: data.flyerImageUrl ?? data.coverImageUrl ?? null,
          coverImageUrl: data.coverImageUrl ?? data.flyerImageUrl ?? null,
          heroImageUrl: data.heroImageUrl ?? null,
          socialImageUrl: data.socialImageUrl ?? null,
          liveUrl: data.liveUrl ?? null,
          registrationUrl: data.registrationUrl ?? null,
          testimonyUrl: data.testimonyUrl ?? null,
          primaryCtaLabel: data.primaryCtaLabel ?? null,
          primaryCtaUrl: data.primaryCtaUrl ?? null,
          secondaryCtaLabel: data.secondaryCtaLabel ?? null,
          secondaryCtaUrl: data.secondaryCtaUrl ?? null,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
          hostName: data.hostName ?? null,
          guestMinister: data.guestMinister ?? null,
          contactPhone: data.contactPhone ?? null,
          contactEmail: data.contactEmail ?? null,
          contactWhatsapp: data.contactWhatsapp ?? null,
          status,
          featured: data.featured ?? false,
          rsvpEnabled: data.rsvpEnabled ?? true,
          registrationRequired: data.registrationRequired ?? data.rsvpEnabled ?? true,
          capacity: data.capacity ?? null,
          customPath: data.customPath ?? null,
          order: data.order ?? 0,
          publishedAt: status === EventStatus.PUBLISHED ? now : null,
          updatedAt: now,
        },
      });
      await this.replaceSchedules(tx, id, data.schedules ?? []);
      await this.replaceSections(tx, id, sections ?? []);
      return tx.event.findUniqueOrThrow({
        where: { id },
        include: {
          Schedules: { orderBy: { sortOrder: 'asc' } },
          Sections: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { Rsvps: true } },
        },
      });
    });

    this.revalidateEvent(slug);
    if (status === EventStatus.PUBLISHED) await this.announceIfPublished(event);
    return event;
  }

  async update(id: string, data: UpdateEventDto) {
    const current = await this.getById(id); // 404 if foreign tenant
    this.validateEventWindow(data, current.startAt, current.endAt);
    const sections = this.validateSections(data.sections);
    const nowPublishing =
      data.status === EventStatus.PUBLISHED && current.status !== EventStatus.PUBLISHED;

    const slug =
      data.slug && data.slug !== current.slug
        ? await this.uniqueSlug(data.slug, id)
        : undefined;

    const event = await this.prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          ...(slug && { slug }),
          ...(data.title !== undefined && { title: data.title }),
          ...(data.tagline !== undefined && { tagline: data.tagline || null }),
          ...(data.theme !== undefined && { theme: data.theme || null }),
          ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription || null }),
          ...(data.description !== undefined && { description: data.description || null }),
          ...(data.startAt !== undefined && { startAt: new Date(data.startAt) }),
          ...(data.endAt !== undefined && { endAt: data.endAt ? new Date(data.endAt) : null }),
          ...(data.timezone !== undefined && { timezone: data.timezone }),
          ...(data.locationType !== undefined && { locationType: data.locationType }),
          ...(data.venueName !== undefined && { venueName: data.venueName || null }),
          ...(data.venueAddress !== undefined && { venueAddress: data.venueAddress || null }),
          ...(data.mapsLink !== undefined && { mapsLink: data.mapsLink || null }),
          ...(data.flyerImageUrl !== undefined && { flyerImageUrl: data.flyerImageUrl || null }),
          ...(data.coverImageUrl !== undefined && {
            coverImageUrl: data.coverImageUrl || null,
            flyerImageUrl: data.coverImageUrl || null,
          }),
          ...(data.heroImageUrl !== undefined && { heroImageUrl: data.heroImageUrl || null }),
          ...(data.socialImageUrl !== undefined && { socialImageUrl: data.socialImageUrl || null }),
          ...(data.liveUrl !== undefined && { liveUrl: data.liveUrl || null }),
          ...(data.registrationUrl !== undefined && { registrationUrl: data.registrationUrl || null }),
          ...(data.testimonyUrl !== undefined && { testimonyUrl: data.testimonyUrl || null }),
          ...(data.primaryCtaLabel !== undefined && { primaryCtaLabel: data.primaryCtaLabel || null }),
          ...(data.primaryCtaUrl !== undefined && { primaryCtaUrl: data.primaryCtaUrl || null }),
          ...(data.secondaryCtaLabel !== undefined && { secondaryCtaLabel: data.secondaryCtaLabel || null }),
          ...(data.secondaryCtaUrl !== undefined && { secondaryCtaUrl: data.secondaryCtaUrl || null }),
          ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle || null }),
          ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription || null }),
          ...(data.hostName !== undefined && { hostName: data.hostName || null }),
          ...(data.guestMinister !== undefined && { guestMinister: data.guestMinister || null }),
          ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone || null }),
          ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail || null }),
          ...(data.contactWhatsapp !== undefined && { contactWhatsapp: data.contactWhatsapp || null }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.featured !== undefined && { featured: data.featured }),
          ...(data.rsvpEnabled !== undefined && { rsvpEnabled: data.rsvpEnabled }),
          ...(data.registrationRequired !== undefined && { registrationRequired: data.registrationRequired }),
          ...(data.capacity !== undefined && { capacity: data.capacity }),
          ...(data.customPath !== undefined && { customPath: data.customPath || null }),
          ...(data.order !== undefined && { order: data.order }),
          ...(nowPublishing && { publishedAt: new Date() }),
          updatedAt: new Date(),
        },
      });
      if (data.schedules !== undefined) await this.replaceSchedules(tx, id, data.schedules);
      if (sections !== undefined) await this.replaceSections(tx, id, sections);
      return tx.event.findUniqueOrThrow({
        where: { id },
        include: {
          Schedules: { orderBy: { sortOrder: 'asc' } },
          Sections: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { Rsvps: true } },
        },
      });
    });

    this.revalidateEvent(current.slug);
    if (slug) this.revalidateEvent(slug);
    if (nowPublishing) await this.announceIfPublished(event);
    return event;
  }

  /**
   * Publishing an event tells the church about it: the announcement it raises
   * reaches the dashboard and the notification inbox, where members already
   * look, rather than waiting to be found on the events page.
   *
   * announceEvent is idempotent on the event id and swallows its own failures,
   * so a republish announces nothing twice and a failed announcement never
   * fails the publish.
   */
  private async announceIfPublished(event: {
    id: string;
    slug: string;
    title: string;
    tagline: string | null;
    shortDescription: string | null;
    description: string | null;
    startAt: Date;
    venueName: string | null;
    flyerImageUrl: string | null;
    customPath: string | null;
  }) {
    await this.announcements.announceEvent(event);
  }

  async delete(id: string) {
    const current = await this.getById(id);
    const result = await this.prisma.event.deleteMany({
      where: { id, tenantId: this.tenantId },
    });
    if (result.count === 0) throw new NotFoundException('Event not found');
    this.revalidateEvent(current.slug);
    return { id, deleted: true };
  }

  // ── RSVP ────────────────────────────────────────────────────────────────────

  /** Public: capture an RSVP against a published, RSVP-enabled event. */
  async createRsvp(slug: string, data: CreateEventRsvpDto) {
    const event = await this.getBySlug(slug); // 404 if not published
    const attendees = data.attendees ?? 1;
    await this.assertRsvpAllowed(event.id, event.registrationRequired && event.rsvpEnabled, event.capacity, attendees);

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
   * Idempotent: re-submitting (e.g. a stale client that thinks it isn't registered yet)
   * returns the existing RSVP instead of creating a duplicate row.
   */
  async createRsvpAsMember(slug: string, profileId: string) {
    const event = await this.getBySlug(slug); // 404 if not published
    const member = await this.prisma.member.findFirst({
      where: { tenantId: this.tenantId, profileId },
    });
    if (!member) throw new NotFoundException('Member record not found for current user');

    const existing = await this.findMemberRsvp(event.id, member.email);
    if (existing) {
      return { success: true, message: 'Already registered' };
    }

    await this.assertRsvpAllowed(event.id, event.registrationRequired && event.rsvpEnabled, event.capacity, 1);

    await this.saveRsvp(event.id, {
      fullName: `${member.firstName} ${member.lastName}`.trim(),
      email: member.email ?? '',
      phone: member.phone,
      attendees: 1,
      message: null,
    });

    return { success: true, message: 'RSVP received' };
  }

  /**
   * Whether the signed-in member already has an RSVP for this event — the frontend's
   * "Registered" state is sourced from here rather than browser storage, so it's
   * consistent across devices/sessions instead of resetting when local state is lost.
   */
  async getRsvpStatusForMember(slug: string, profileId: string) {
    const event = await this.getBySlug(slug); // 404 if not published
    const member = await this.prisma.member.findFirst({
      where: { tenantId: this.tenantId, profileId },
    });
    if (!member) return { registered: false };

    const existing = await this.findMemberRsvp(event.id, member.email);
    return { registered: !!existing };
  }

  private async findMemberRsvp(eventId: string, email: string | null) {
    if (!email) return null;
    return this.prisma.eventRsvp.findFirst({
      where: { tenantId: this.tenantId, eventId, email: { equals: email, mode: 'insensitive' } },
    });
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

  private validateEventWindow(
    data: UpdateEventDto,
    currentStart?: Date,
    currentEnd?: Date | null,
  ) {
    const start = data.startAt ? new Date(data.startAt) : currentStart;
    const end = data.endAt !== undefined
      ? (data.endAt ? new Date(data.endAt) : null)
      : currentEnd;
    if (start && end && end < start) {
      throw new BadRequestException('Event end date must be on or after its start date.');
    }
    if (data.timezone) {
      try {
        new Intl.DateTimeFormat('en-NG', { timeZone: data.timezone }).format();
      } catch {
        throw new BadRequestException('timezone must be a valid IANA timezone.');
      }
    }
  }

  private validateSections(sections: CreateEventDto['sections']) {
    if (sections === undefined) return undefined;
    return sections.map((section, index) => {
      const result = eventSectionInputSchema.safeParse({
        type: section.type,
        content: section.content,
      });
      if (!result.success) {
        throw new BadRequestException({
          message: 'Invalid event section',
          details: result.error.issues.map((issue) => ({
            path: `sections.${index}.${issue.path.join('.')}`,
            message: issue.message,
          })),
        });
      }
      return { ...section, content: result.data.content };
    });
  }

  private async replaceSchedules(
    tx: Prisma.TransactionClient,
    eventId: string,
    schedules: NonNullable<CreateEventDto['schedules']>,
  ) {
    await tx.eventSchedule.deleteMany({ where: { eventId, tenantId: this.tenantId } });
    if (!schedules.length) return;
    await tx.eventSchedule.createMany({
      data: schedules.map((schedule, index) => ({
        id: randomUUID(),
        tenantId: this.tenantId,
        eventId,
        title: schedule.title.trim(),
        description: schedule.description?.trim() || null,
        startTime: schedule.startTime,
        endTime: schedule.endTime || null,
        recurrenceRule: schedule.recurrenceRule?.trim() || null,
        meetingUrl: schedule.meetingUrl?.trim() || null,
        sortOrder: schedule.sortOrder ?? index,
        updatedAt: new Date(),
      })),
    });
  }

  private async replaceSections(
    tx: Prisma.TransactionClient,
    eventId: string,
    sections: NonNullable<ReturnType<EventsService['validateSections']>>,
  ) {
    await tx.eventSection.deleteMany({ where: { eventId, tenantId: this.tenantId } });
    if (!sections.length) return;
    await tx.eventSection.createMany({
      data: sections.map((section, index) => ({
        id: randomUUID(),
        tenantId: this.tenantId,
        eventId,
        type: section.type,
        title: section.title?.trim() || null,
        subtitle: section.subtitle?.trim() || null,
        content: section.content as Prisma.InputJsonValue,
        sortOrder: section.sortOrder ?? index,
        isVisible: section.isVisible ?? true,
        updatedAt: new Date(),
      })),
    });
  }

  private revalidateEvent(slug: string) {
    this.revalidate.trigger(
      ['events', `event:${slug}`],
      ['/', '/events', `/events/${slug}`],
    );
  }

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
