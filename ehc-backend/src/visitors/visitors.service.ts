import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { UpdateVisitorDto } from './dto/update-visitor.dto';

/**
 * Visitor queries + admin edit/delete for first-timer records.
 *
 * Visitor records are CREATED by FormsService (first-timer registration).
 * Conversion to a Member happens via MembersService.convertVisitorToMember —
 * this module covers everything else: listing, editing corrections
 * (misspelled names, wrong phone numbers), and removing bad/duplicate rows.
 */
@Injectable()
export class VisitorsService {
  private readonly tenantId: string;

  constructor(prisma: PrismaService, config: ConfigService<Env, true>) {
    this.prisma = prisma;
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private readonly prisma: PrismaService;

  /** Only unconverted visitors — once someone has a member account, they drop off this list. */
  async list(opts: { limit?: number; search?: string } = {}) {
    const where: Record<string, unknown> = { tenantId: this.tenantId, convertedAt: null };
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

  async update(id: string, dto: UpdateVisitorDto) {
    await this.getById(id); // 404s if missing/wrong tenant, same as getById

    if (dto.email) {
      const clash = await this.prisma.visitor.findFirst({
        where: { tenantId: this.tenantId, email: dto.email, id: { not: id } },
        select: { id: true },
      });
      if (clash) throw new ConflictException(`Another visitor already uses email "${dto.email}"`);
    }
    if (dto.phone) {
      const clash = await this.prisma.visitor.findFirst({
        where: { tenantId: this.tenantId, phone: dto.phone, id: { not: id } },
        select: { id: true },
      });
      if (clash) throw new ConflictException(`Another visitor already uses phone "${dto.phone}"`);
    }

    return this.prisma.visitor.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const result = await this.prisma.visitor.deleteMany({ where: { id, tenantId: this.tenantId } });
    if (result.count === 0) throw new NotFoundException('Visitor not found');
    return { id, deleted: true };
  }

  /** All-time first-timer count broken down by attendance type. Same
   * in-person/online matching convention as AnalyticsService.getFirstTimerPipeline. */
  async getStats() {
    const t = this.tenantId;
    const [total, onsite, online] = await Promise.all([
      this.prisma.visitor.count({ where: { tenantId: t } }),
      this.prisma.visitor.count({ where: { tenantId: t, attendanceType: { contains: 'person', mode: 'insensitive' } } }),
      this.prisma.visitor.count({ where: { tenantId: t, attendanceType: { contains: 'online', mode: 'insensitive' } } }),
    ]);
    return { total, onsite, online };
  }
}
