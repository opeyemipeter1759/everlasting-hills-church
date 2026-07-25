import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { HeadcountRow } from '../headcount.util';

@Injectable()
export class HeadcountAuditService {
  private readonly logger = new Logger(HeadcountAuditService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  snapshot(hc: HeadcountRow): Prisma.InputJsonValue {
    return {
      men: hc.men, women: hc.women, boys: hc.boys, girls: hc.girls,
      firstTimers: hc.firstTimers, total: hc.total, reportedTotal: hc.reportedTotal,
      status: hc.status, notes: hc.notes,
    };
  }

  async write(entry: {
    action: string;
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
          entity: 'ServiceHeadcount',
          entityId: entry.entityId ?? null,
          before: entry.before ?? Prisma.DbNull,
          after: entry.after ?? Prisma.DbNull,
        },
      });
    } catch (err) {
      // Audit must never break the mutation it records.
      this.logger.error(`Audit write failed (${entry.action} ServiceHeadcount): ${(err as Error).message}`);
    }
  }
}
