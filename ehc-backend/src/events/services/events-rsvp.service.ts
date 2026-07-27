import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { CreateEventRsvpDto } from '../dto/event-rsvp.dto';
import { EventsPublicReadService } from './events-public-read.service';
import { EventsAdminReadService } from './events-admin-read.service';

@Injectable()
export class EventsRsvpService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly publicRead: EventsPublicReadService,
    private readonly adminRead: EventsAdminReadService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private async assertRsvpAllowed(eventId: string, rsvpEnabled: boolean, capacity: number | null, attendees: number) {
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

  /** Public: capture an RSVP against a published, RSVP-enabled event. */
  async createRsvp(slug: string, data: CreateEventRsvpDto) {
    const event = await this.publicRead.getBySlug(slug); // 404 if not published
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
    const event = await this.publicRead.getBySlug(slug); // 404 if not published
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

  /** Admin: RSVPs for one event (most recent first), flagged with whether each is an existing member. */
  async listRsvps(eventId: string) {
    await this.adminRead.getById(eventId); // 404 if foreign tenant
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
}
