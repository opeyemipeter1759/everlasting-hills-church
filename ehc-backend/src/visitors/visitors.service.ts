import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

/**
 * Read-only Visitor queries for admin dashboards.
 *
 * Visitor records are CREATED by FormsService (first-timer registration). This module is
 * purely the admin read-side — we don't expose update/delete endpoints. Conversion to a
 * Member happens via MembersService.convertVisitorToMember.
 */
@Injectable()
export class VisitorsService {
  private readonly tenantId: string;

  constructor(prisma: PrismaService, config: ConfigService<Env, true>) {
    this.prisma = prisma;
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private readonly prisma: PrismaService;

  async list(opts: { limit?: number; search?: string } = {}) {
    const where: Record<string, unknown> = { tenantId: this.tenantId };
    if (opts.search) {
      where.OR = [
        { firstName: { contains: opts.search, mode: 'insensitive' } },
        { lastName: { contains: opts.search, mode: 'insensitive' } },
        { email: { contains: opts.search, mode: 'insensitive' } },
        { phone: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.visitor.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      take: opts.limit ?? 50,
    });
  }

  async getById(id: string) {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!visitor) throw new NotFoundException('Visitor not found');
    return visitor;
  }

  async count() {
    return this.prisma.visitor.count({ where: { tenantId: this.tenantId } });
  }
}
