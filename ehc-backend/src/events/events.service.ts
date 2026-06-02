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
    if (!event.rsvpEnabled) {
      throw new BadRequestException('RSVPs are closed for this event');
    }

    const attendees = data.attendees ?? 1;

    if (event.capacity != null) {
      const agg = await this.prisma.eventRsvp.aggregate({
        where: { tenantId: this.tenantId, eventId: event.id },
        _sum: { attendees: true },
      });
      const reserved = agg._sum.attendees ?? 0;
      if (reserved + attendees > event.capacity) {
        throw new BadRequestException('This event is fully booked');
      }
    }

    await this.prisma.eventRsvp.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        eventId: event.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        attendees,
        message: data.message ?? null,
      },
    });

    return { success: true, message: 'RSVP received' };
  }

  /** Admin: RSVPs for one event (most recent first). */
  async listRsvps(eventId: string) {
    await this.getById(eventId); // 404 if foreign tenant
    return this.prisma.eventRsvp.findMany({
      where: { tenantId: this.tenantId, eventId },
      orderBy: { createdAt: 'desc' },
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
