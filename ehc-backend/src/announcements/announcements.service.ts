import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InboxService } from '../inbox/inbox.service';
import { MailDispatcher } from '../jobs/mail-dispatcher';
import { buildAnnouncementEmail } from '../notifications/templates/announcement.email';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import type { Env } from '../config/env.validation';

/**
 * Church-wide announcements. Creating one fans out a Notification row to every
 * member's profile (so it appears in their dashboard bell) and, when requested,
 * also emails members who have an address on file.
 */
@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    private readonly mail: MailDispatcher,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async create(dto: CreateAnnouncementDto, createdById: string | null) {
    // Recipients = every profile in the tenant, with their member email (if any).
    const profiles = await this.prisma.profile.findMany({
      where: { tenantId: this.tenantId },
      select: { id: true, Member: { select: { email: true } } },
    });

    // 1) In-app fan-out.
    const created = await this.inbox.createMany(
      profiles.map((p) => ({
        tenantId: this.tenantId,
        profileId: p.id,
        title: dto.title,
        body: dto.body,
        type: 'announcement',
        link: '/dashboard',
      })),
    );

    // 2) Persist the announcement record.
    const announcement = await this.prisma.announcement.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        title: dto.title,
        body: dto.body,
        audience: dto.audience ?? 'all',
        sendEmail: dto.sendEmail ?? false,
        createdById,
        recipients: created,
      },
    });

    // 3) Optional email blast to members with an address on file.
    if (dto.sendEmail) {
      const emails = profiles
        .map((p) => p.Member?.email)
        .filter((e): e is string => Boolean(e));
      for (const email of emails) {
        await this.mail.dispatch(
          buildAnnouncementEmail({ email, title: dto.title, body: dto.body }),
        );
      }
      this.logger.log(`Announcement "${dto.title}" emailed to ${emails.length} member(s)`);
    }

    this.logger.log(
      `Announcement "${dto.title}" created → ${created} in-app notification(s)`,
    );
    return announcement;
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
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, body: true, createdAt: true },
    });
  }
}
