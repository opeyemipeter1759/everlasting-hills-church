import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { EventStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InboxService } from '../inbox/inbox.service';
import { MailDispatcher } from '../jobs/mail-dispatcher';
import { buildAnnouncementEmail } from '../notifications/templates/announcement.email';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { PushEvents, type AnnouncementPublishedPayload } from '../push/push.events';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import type { Env } from '../config/env.validation';

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

  /** In-app fan-out + optional email blast. Returns the recipient count. */
  private async fanOut(title: string, body: string, sendEmail: boolean): Promise<number> {
    const profiles = await this.prisma.profile.findMany({
      where: { tenantId: this.tenantId },
      select: { id: true, Member: { select: { email: true } } },
    });

    const created = await this.inbox.createMany(
      profiles.map((p) => ({
        tenantId: this.tenantId,
        profileId: p.id,
        title,
        body,
        type: 'announcement',
        link: '/dashboard',
      })),
    );

    if (sendEmail) {
      const frontendUrl =
        this.config.get('FRONTEND_URL', { infer: true })?.replace(/\/$/, '') ??
        'https://everlastinghills.org';
      const dashboardUrl = `${frontendUrl}/dashboard`;

      const emails = profiles
        .map((p) => p.Member?.email)
        .filter((e): e is string => Boolean(e));

      // Dispatch in batches of 8 with a 1-second pause between batches to stay
      // well under Resend's 10 req/s rate limit.
      const BATCH = 8;
      for (let i = 0; i < emails.length; i += BATCH) {
        const batch = emails.slice(i, i + BATCH);
        await Promise.all(
          batch.map((email) =>
            this.mail.dispatch(buildAnnouncementEmail({ email, title, body, dashboardUrl })),
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

    const recipients = shouldFanOut ? await this.fanOut(dto.title, dto.body, sendEmail) : 0;

    const created = await this.prisma.announcement.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        title: dto.title,
        body: dto.body,
        imageUrl: dto.imageUrl ?? null,
        audience: dto.audience ?? 'all',
        sendEmail,
        status,
        createdById,
        recipients,
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
      select: { id: true, title: true, body: true, imageUrl: true, createdAt: true },
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

  /** Edits copy only — never re-triggers a fan-out. Use /publish for that. */
  async update(id: string, dto: UpdateAnnouncementDto) {
    await this.findOwnedOrThrow(id);
    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.sendEmail !== undefined && { sendEmail: dto.sendEmail }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl || null }),
      },
    });
  }

  /** Publishes a saved draft: fans out now, flips status, records recipient count. */
  async publish(id: string) {
    const announcement = await this.findOwnedOrThrow(id);
    if (announcement.status === EventStatus.PUBLISHED) {
      return announcement;
    }
    const recipients = await this.fanOut(announcement.title, announcement.body, announcement.sendEmail);
    const published = await this.prisma.announcement.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED, recipients },
    });
    this.emitPush(published);
    return published;
  }

  async remove(id: string) {
    await this.findOwnedOrThrow(id);
    await this.prisma.announcement.delete({ where: { id } });
    return { id, deleted: true };
  }
}
