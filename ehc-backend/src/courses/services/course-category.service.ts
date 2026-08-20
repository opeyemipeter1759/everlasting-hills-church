import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { CourseCategoryInputSchema } from '../dto/course.schema';
import { CoursesSharedService } from './courses-shared.service';

@Injectable()
export class CourseCategoryService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: CoursesSharedService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async listCategories() {
    const [categories, counts] = await Promise.all([
      this.prisma.courseCategory.findMany({
        where: { tenantId: this.tenantId },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.course.groupBy({
        by: ['categoryId'],
        where: { tenantId: this.tenantId, categoryId: { not: null } },
        _count: { _all: true },
      }),
    ]);
    const courseCountByCategory = new Map(counts.map((c) => [c.categoryId as string, c._count._all]));
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentId: c.parentId,
      courseCount: courseCountByCategory.get(c.id) ?? 0,
    }));
  }

  async createCategory(actor: AuthUser, raw: unknown) {
    const dto = parseSchema(CourseCategoryInputSchema, raw);
    if (dto.parentId) await this.shared.assertCategoryExists(dto.parentId);

    const id = randomUUID();
    const slug = await this.shared.uniqueCategorySlug(dto.name);
    await this.prisma.courseCategory.create({
      data: {
        id,
        tenantId: this.tenantId,
        name: dto.name,
        slug,
        description: dto.description ?? null,
        parentId: dto.parentId ?? null,
      },
    });
    await this.shared.writeAudit({ action: 'CREATE', entityId: id, actorId: actor.userId, after: { name: dto.name } });
    return this.listCategories();
  }

  async updateCategory(actor: AuthUser, id: string, raw: unknown) {
    const dto = parseSchema(CourseCategoryInputSchema, raw);
    const existing = await this.prisma.courseCategory.findFirst({ where: { tenantId: this.tenantId, id } });
    if (!existing) throw new NotFoundException('Category not found');
    if (dto.parentId === id) throw new BadRequestException('A category cannot be its own parent');
    if (dto.parentId) await this.shared.assertCategoryExists(dto.parentId);

    const slug = dto.name === existing.name ? existing.slug : await this.shared.uniqueCategorySlug(dto.name, id);
    await this.prisma.courseCategory.update({
      where: { id },
      data: { name: dto.name, slug, description: dto.description ?? null, parentId: dto.parentId ?? null },
    });
    await this.shared.writeAudit({ action: 'UPDATE', entityId: id, actorId: actor.userId, after: { name: dto.name } });
    return this.listCategories();
  }

  async removeCategory(actor: AuthUser, id: string) {
    const existing = await this.prisma.courseCategory.findFirst({ where: { tenantId: this.tenantId, id } });
    if (!existing) throw new NotFoundException('Category not found');

    const [childCount, courseCount] = await Promise.all([
      this.prisma.courseCategory.count({ where: { parentId: id } }),
      this.prisma.course.count({ where: { categoryId: id } }),
    ]);
    if (childCount > 0) throw new BadRequestException('Move or delete its subcategories first');
    if (courseCount > 0) throw new BadRequestException('Reassign its courses to another category first');

    await this.prisma.courseCategory.delete({ where: { id } });
    await this.shared.writeAudit({ action: 'DELETE', entityId: id, actorId: actor.userId, after: { name: existing.name } });
    return { id, deleted: true };
  }
}
