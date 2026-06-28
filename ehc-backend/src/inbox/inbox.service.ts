import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationInput {
  tenantId: string;
  profileId: string;
  title: string;
  body?: string | null;
  type?: string;
  link?: string | null;
}

/**
 * In-app notification inbox (one row per recipient). Read by the dashboard
 * bell; written by announcement fan-out and other system events.
 */
@Injectable()
export class InboxService {
  constructor(private readonly prisma: PrismaService) {}

  /** Bulk-create notifications (used by announcement fan-out). Returns the count. */
  async createMany(items: CreateNotificationInput[]): Promise<number> {
    if (items.length === 0) return 0;
    const res = await this.prisma.notification.createMany({
      data: items.map((n) => ({
        id: randomUUID(),
        tenantId: n.tenantId,
        profileId: n.profileId,
        title: n.title,
        body: n.body ?? null,
        type: n.type ?? 'general',
        link: n.link ?? null,
      })),
    });
    return res.count;
  }

  async listForProfile(profileId: string | null) {
    if (!profileId) return [];
    return this.prisma.notification.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount(profileId: string | null): Promise<number> {
    if (!profileId) return 0;
    return this.prisma.notification.count({
      where: { profileId, readAt: null },
    });
  }

  /** Mark a single notification read. Scoped to the owner so users can't touch others'. */
  async markRead(profileId: string | null, id: string): Promise<void> {
    if (!profileId) return;
    await this.prisma.notification.updateMany({
      where: { id, profileId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(profileId: string | null): Promise<number> {
    if (!profileId) return 0;
    const res = await this.prisma.notification.updateMany({
      where: { profileId, readAt: null },
      data: { readAt: new Date() },
    });
    return res.count;
  }
}
