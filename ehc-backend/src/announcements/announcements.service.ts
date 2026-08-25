import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { EventStatus, Prisma, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InboxService } from '../inbox/inbox.service';
import { MailDispatcher } from '../jobs/mail-dispatcher';
import { buildAnnouncementEmail } from '../notifications/templates/announcement.email';
import { roleFilter } from '../members/members-directory.util';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { PushEvents, type AnnouncementPublishedPayload } from '../push/push.events';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import type { Env } from '../config/env.validation';

interface AudienceTargeting {
  targetRoles: Role[];
  targetGenders: string[];
  targetProfileIds: string[];
}

/**
 * Church-wide announcements. Publishing one (on create, or later via /publish
 * for a saved draft) fans out a Notification row to every member's profile
 * and, when requested, emails members who have an address on file.
 */
@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    private readonly mail: MailDispatcher,
    private readonly emitter: EventEmitter2,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private hasTargeting(targeting: AudienceTargeting): boolean {
    return targeting.targetRoles.length > 0 || targeting.targetGenders.length > 0 || targeting.targetProfileIds.length > 0;
  }

  /** Builds the Profile where-clause for the EMAIL audience specifically. Empty
   * targeting means "everyone" (unchanged default); otherwise the email goes to
   * the UNION of profiles matching any given role, any given gender, or
   * explicitly listed by id. Never affects who sees the in-app notification —
   * that always fans out church-wide, see fanOut(). */
  private resolveAudienceWhere(targeting: AudienceTargeting): Prisma.ProfileWhereInput {
    if (!this.hasTargeting(targeting)) {
      return { tenantId: this.tenantId };
    }
    const OR: Prisma.ProfileWhereInput[] = [];
    for (const role of targeting.targetRoles) OR.push(roleFilter(role));
    if (targeting.targetGenders.length > 0) OR.push({ Member: { gender: { in: targeting.targetGenders } } });
    if (targeting.targetProfileIds.length > 0) OR.push({ id: { in: targeting.targetProfileIds } });
    return { tenantId: this.tenantId, OR };
  }

  /** In-app fan-out (always church-wide) + optional, separately-targeted email
   * blast. Returns the in-app recipient count. */
  private async fanOut(
    title: string,
    body: string,
    sendEmail: boolean,
    targeting: AudienceTargeting,
    imageUrl?: string | null,
  ): Promise<number> {
    const allProfiles = await this.prisma.profile.findMany({
      where: { tenantId: this.tenantId },
      select: { id: true, Member: { select: { email: true } } },
    });

    const created = await this.inbox.createMany(
      allProfiles.map((p) => ({
        tenantId: this.tenantId,
        profileId: p.id,
        title,
        body,
        type: 'announcement',
        link: '/dashboard',
      })),
    );

    if (sendEmail) {
      // Targeting only narrows the EMAIL audience — reuse the already-fetched
      // church-wide list when there's no targeting, otherwise re-query scoped
      // to the selected roles/gender/people.
      const emailProfiles = this.hasTargeting(targeting)
        ? await this.prisma.profile.findMany({
            where: this.resolveAudienceWhere(targeting),
            select: { Member: { select: { email: true } } },
          })
        : allProfiles;

      const frontendUrl =
        this.config.get('FRONTEND_URL', { infer: true })?.replace(/\/$/, '') ??
        'https://everlastinghills.org';
      const dashboardUrl = `${frontendUrl}/dashboard`;

      const emails = emailProfiles
        .map((p) => p.Member?.email)
        .filter((e): e is string => Boolean(e));

      // Dispatch in batches of 8 with a 1-second pause between batches to stay
      // well under Resend's 10 req/s rate limit.
      const BATCH = 8;
      for (let i = 0; i < emails.length; i += BATCH) {
        const batch = emails.slice(i, i + BATCH);
        await Promise.all(
          batch.map((email) =>
            this.mail.dispatch(
              buildAnnouncementEmail({ email, title, body, dashboardUrl, imageUrl }),
            ),
          ),
        );
        if (i + BATCH < emails.length) {
          await new Promise((r) => setTimeout(r, 1_100));
        }
      }
      this.logger.log(`Announcement "${title}" emailed to ${emails.length} member(s)`);
    }

    this.logger.log(`Announcement "${title}" fanned out → ${created} in-app notification(s)`);
    return created;
  }

  async create(dto: CreateAnnouncementDto, createdById: string | null) {
    const status = dto.status ?? EventStatus.PUBLISHED;
    const shouldFanOut = status === EventStatus.PUBLISHED;
    const sendEmail = dto.sendEmail ?? false;
    const targeting: AudienceTargeting = {
      targetRoles: dto.targetRoles ?? [],
      targetGenders: dto.targetGenders ?? [],
      targetProfileIds: dto.targetProfileIds ?? [],
    };
    const isTargeted = targeting.targetRoles.length > 0 || targeting.targetGenders.length > 0 || targeting.targetProfileIds.length > 0;

    const recipients = shouldFanOut
      ? await this.fanOut(dto.title, dto.body, sendEmail, targeting, dto.imageUrl)
      : 0;

    const created = await this.prisma.announcement.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        title: dto.title,
        body: dto.body,
        imageUrl: dto.imageUrl ?? null,
        audience: dto.audience ?? (isTargeted ? 'custom' : 'all'),
        sendEmail,
        status,
        createdById,
        recipients,
        targetRoles: targeting.targetRoles,
        targetGenders: targeting.targetGenders,
        targetProfileIds: targeting.targetProfileIds,
        targetProfileNames: dto.targetProfileNames ?? [],
        eventTime: dto.eventTime ?? null,
        venue: dto.venue ?? null,
      },
    });

    // Emitted after the row exists so the notification can carry a real id for
    // its collapse tag. Push sits beside the in-app fan-out and the optional
    // email rather than replacing either: they are separate channels with
    // separate opt-outs.
    if (shouldFanOut) this.emitPush(created);

    return created;
  }

  /** Fire-and-forget push fan-out. Never awaited, never allowed to fail a request. */
  private emitPush(announcement: { id: string; title: string; body: string; audience: string }) {
    this.emitter.emit(PushEvents.AnnouncementPublished, {
      tenantId: this.tenantId,
      announcementId: announcement.id,
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience,
    } satisfies AnnouncementPublishedPayload);
  }

  async list() {
    return this.prisma.announcement.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listFeed() {
    return this.prisma.announcement.findMany({
      where: { tenantId: this.tenantId, status: EventStatus.PUBLISHED },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, body: true, imageUrl: true, createdAt: true, eventTime: true, venue: true },
    });
  }

  private async findOwnedOrThrow(id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    return announcement;
  }

  /** Edits copy/targeting/event-details only — never re-triggers a fan-out. Use
   * /publish for that (targeting changes here only take effect on that next publish). */
  async update(id: string, dto: UpdateAnnouncementDto) {
    const existing = await this.findOwnedOrThrow(id);
    const touchesTargeting =
      dto.targetRoles !== undefined || dto.targetGenders !== undefined || dto.targetProfileIds !== undefined;
    const nextRoles = dto.targetRoles ?? existing.targetRoles;
    const nextGenders = dto.targetGenders ?? existing.targetGenders;
    const nextProfileIds = dto.targetProfileIds ?? existing.targetProfileIds;
    const isTargeted = nextRoles.length > 0 || nextGenders.length > 0 || nextProfileIds.length > 0;

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.sendEmail !== undefined && { sendEmail: dto.sendEmail }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl || null }),
        ...(dto.targetRoles !== undefined && { targetRoles: dto.targetRoles }),
        ...(dto.targetGenders !== undefined && { targetGenders: dto.targetGenders }),
        ...(dto.targetProfileIds !== undefined && { targetProfileIds: dto.targetProfileIds }),
        ...(dto.targetProfileNames !== undefined && { targetProfileNames: dto.targetProfileNames }),
        ...(touchesTargeting && { audience: isTargeted ? 'custom' : 'all' }),
        ...(dto.eventTime !== undefined && { eventTime: dto.eventTime || null }),
        ...(dto.venue !== undefined && { venue: dto.venue || null }),
      },
    });
  }

  /**
   * Publishes a saved draft: fans out now, flips status, records recipient count.
   *
   * `sendEmail` overrides what the announcement was saved with, for this publish
   * and from here on. It exists because publishing something that was
   * unpublished (an event that has passed, then reinstated) otherwise emails the
   * whole church a second time with no way to say no — the in-app fan-out is
   * cheap and idempotent enough to repeat, a second inbox copy of the same
   * flyer is not.
   */
  async publish(id: string, options: { sendEmail?: boolean } = {}) {
    const announcement = await this.findOwnedOrThrow(id);
    if (announcement.status === EventStatus.PUBLISHED) {
      return announcement;
    }
    const sendEmail = options.sendEmail ?? announcement.sendEmail;
    const recipients = await this.fanOut(
      announcement.title,
      announcement.body,
      sendEmail,
      {
        targetRoles: announcement.targetRoles,
        targetGenders: announcement.targetGenders,
        targetProfileIds: announcement.targetProfileIds,
      },
      announcement.imageUrl,
    );
    const published = await this.prisma.announcement.update({
      where: { id },
      // The choice is persisted so the card's "Emailed" badge and a later edit
      // both reflect what actually happened.
      data: { status: EventStatus.PUBLISHED, recipients, sendEmail },
    });
    this.emitPush(published);
    return published;
  }

  /**
   * Takes a live announcement off the member surfaces by flipping it back to
   * DRAFT — the feed, the member dashboard panel and the public list all filter
   * on PUBLISHED. For an event that has come and gone, this is what an admin
   * wants: it stops being shown without losing the record of it.
   *
   * Deliberately does NOT retract what was already delivered. The inbox
   * notifications are independent copies with no link back to this row, and any
   * email is long gone; deleting a member's read notifications to tidy up an
   * expired event would be surprising, and the same reasoning already governs
   * delete (see the copy in AnnouncementDialogs).
   *
   * Publishing again fans out again — that is why the admin UI warns when the
   * announcement has been sent before.
   */
  async unpublish(id: string) {
    const announcement = await this.findOwnedOrThrow(id);
    if (announcement.status === EventStatus.DRAFT) {
      return announcement;
    }
    return this.prisma.announcement.update({
      where: { id },
      data: { status: EventStatus.DRAFT },
    });
  }

  async remove(id: string) {
    await this.findOwnedOrThrow(id);
    await this.prisma.announcement.delete({ where: { id } });
    return { id, deleted: true };
  }
}
