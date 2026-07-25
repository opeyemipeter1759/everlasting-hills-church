import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import slugify from 'slugify';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';

/** Helpers shared across the courses module: audit logging, slugs, category checks, member resolution. */
@Injectable()
export class CoursesSharedService {
  private readonly logger = new Logger(CoursesSharedService.name);
  readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async writeAudit(entry: { action: string; entityId: string; actorId: string; after?: Prisma.InputJsonValue }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          actorId: entry.actorId,
          action: entry.action,
          entity: 'Course',
          entityId: entry.entityId,
          after: entry.after ?? Prisma.DbNull,
        },
      });
    } catch (err) {
      this.logger.error(`Audit write failed (${entry.action} Course): ${(err as Error).message}`);
    }
  }

  async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    const root = slugify(base, { lower: true, strict: true }) || randomUUID().slice(0, 8);
    let candidate = root;
    for (let i = 2; i <= 6; i++) {
      const clash = await this.prisma.course.findFirst({
        where: { tenantId: this.tenantId, slug: candidate, ...(excludeId && { id: { not: excludeId } }) },
        select: { id: true },
      });
      if (!clash) return candidate;
      candidate = `${root}-${i}`;
    }
    return `${root}-${randomUUID().slice(0, 6)}`;
  }

  async uniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
    const root = slugify(base, { lower: true, strict: true }) || randomUUID().slice(0, 8);
    let candidate = root;
    for (let i = 2; i <= 6; i++) {
      const clash = await this.prisma.courseCategory.findFirst({
        where: { tenantId: this.tenantId, slug: candidate, ...(excludeId && { id: { not: excludeId } }) },
        select: { id: true },
      });
      if (!clash) return candidate;
      candidate = `${root}-${i}`;
    }
    return `${root}-${randomUUID().slice(0, 6)}`;
  }

  async assertCategoryExists(categoryId: string) {
    const category = await this.prisma.courseCategory.findFirst({
      where: { id: categoryId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Category not found');
  }

  async resolveMemberId(actor: AuthUser): Promise<string> {
    if (actor.memberId) return actor.memberId;
    const member = actor.profileId
      ? await this.prisma.member.findFirst({ where: { tenantId: this.tenantId, profileId: actor.profileId }, select: { id: true } })
      : null;
    if (!member) throw new BadRequestException('No member profile for this account');
    return member.id;
  }
}
