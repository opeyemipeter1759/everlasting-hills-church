import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

/** Small helpers shared across every departments service: existence checks, member counts, audit. */
@Injectable()
export class DepartmentsSharedService {
  private readonly logger = new Logger(DepartmentsSharedService.name);
  readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async deptOrThrow(id: string) {
    const dept = await this.prisma.department.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  /** Distinct member counts per department (a member in two units counts once). */
  async deptMemberCounts(): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRaw<{ departmentId: string; members: number }[]>`
      SELECT u."departmentId" AS "departmentId", COUNT(DISTINCT um."memberId")::int AS members
      FROM "UnitMember" um
      JOIN "Unit" u ON u.id = um."unitId"
      WHERE u."tenantId" = ${this.tenantId} AND u."departmentId" IS NOT NULL
      GROUP BY u."departmentId"`;
    return new Map(rows.map((r) => [r.departmentId, Number(r.members)]));
  }

  async writeAudit(entry: {
    action: string;
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
      this.logger.error(`Audit write failed (${entry.action} ${entry.entity}): ${(err as Error).message}`);
    }
  }
}
