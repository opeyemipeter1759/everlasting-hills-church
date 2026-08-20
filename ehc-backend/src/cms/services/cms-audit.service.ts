import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

export type CmsAuditAction = 'CREATE' | 'UPDATE' | 'PUBLISH' | 'UNPUBLISH' | 'DELETE' | 'ROLLBACK';

@Injectable()
export class CmsAuditService {
  private readonly logger = new Logger(CmsAuditService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async write(entry: {
    action: CmsAuditAction;
    entity: string;
    entityId?: string | null;
    actorId?: string | null;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          actorId: entry.actorId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          before: entry.before ?? Prisma.DbNull,
          after: entry.after ?? Prisma.DbNull,
        },
      });
    } catch (err) {
      // Audit must never break the mutation it records.
      this.logger.error(`Audit write failed (${entry.action} ${entry.entity}): ${(err as Error).message}`);
    }
  }

  /** Recent audit entries with the actor's name resolved where possible. The log
   * stores `actorId` as the Supabase auth id (`actor.userId` at every call site
   * — see e.g. unit-lead-appointment.service.ts), i.e. Profile.userId, not
   * Profile.id — no FK either way, so this is a batch lookup, not an `include`. */
  async list(limit = 50) {
    const rows = await this.prisma.auditLog.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, limit)),
    });
    if (rows.length === 0) return rows;

    const actorIds = [...new Set(rows.map((r) => r.actorId).filter((id): id is string => !!id))];
    const profiles = actorIds.length
      ? await this.prisma.profile.findMany({
          where: { userId: { in: actorIds } },
          select: { userId: true, Member: { select: { firstName: true, lastName: true } } },
        })
      : [];
    const nameById = new Map(
      profiles.map((p) => [p.userId, p.Member ? `${p.Member.firstName} ${p.Member.lastName}`.trim() : null]),
    );

    return rows.map((r) => ({ ...r, actorName: r.actorId ? nameById.get(r.actorId) ?? null : null }));
  }
}
