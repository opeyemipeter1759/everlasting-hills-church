import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { EmailsService } from '../../emails/emails.service';
import { CourseInputSchema } from '../dto/course.schema';
import { CoursesSharedService } from './courses-shared.service';
import { CoursesReadService } from './courses-read.service';
import { CourseCurriculumWriterService } from './course-curriculum-writer.service';

@Injectable()
export class CoursesCrudService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: CoursesSharedService,
    private readonly read: CoursesReadService,
    private readonly curriculumWriter: CourseCurriculumWriterService,
    private readonly emails: EmailsService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async create(actor: AuthUser, raw: unknown) {
    const dto = parseSchema(CourseInputSchema, raw);
    await this.shared.assertCategoryExists(dto.categoryId);
    const slug = await this.shared.uniqueSlug(dto.title);
    const id = randomUUID();

    await this.prisma.$transaction(async (tx) => {
      await tx.course.create({
        data: {
          id,
          tenantId: this.tenantId,
          slug,
          title: dto.title,
          tagline: dto.tagline,
          description: dto.description,
          categoryId: dto.categoryId,
          iconKey: dto.iconKey,
          gradientFrom: dto.gradient[0],
          gradientTo: dto.gradient[1],
          duration: dto.duration,
          instructorName: dto.instructor.name,
          instructorRole: dto.instructor.role,
          outcomes: dto.outcomes,
          prerequisiteId: dto.prerequisiteId ?? null,
        },
      });
      await this.curriculumWriter.write(tx, id, dto);
    });

    await this.shared.writeAudit({ action: 'CREATE', entityId: id, actorId: actor.userId, after: { title: dto.title } });
    void this.emails.notifyNewContent({ kind: 'course', title: dto.title, path: `/dashboard/courses/${slug}` });
    return this.read.getForAdmin(id);
  }

  async update(actor: AuthUser, id: string, raw: unknown) {
    const dto = parseSchema(CourseInputSchema, raw);
    const existing = await this.prisma.course.findFirst({ where: { tenantId: this.tenantId, id } });
    if (!existing) throw new NotFoundException('Course not found');
    await this.shared.assertCategoryExists(dto.categoryId);

    if (dto.prerequisiteId === id) {
      throw new BadRequestException('A course cannot be its own prerequisite');
    }

    const slug = dto.title === existing.title ? existing.slug : await this.shared.uniqueSlug(dto.title, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id },
        data: {
          slug,
          title: dto.title,
          tagline: dto.tagline,
          description: dto.description,
          categoryId: dto.categoryId,
          iconKey: dto.iconKey,
          gradientFrom: dto.gradient[0],
          gradientTo: dto.gradient[1],
          duration: dto.duration,
          instructorName: dto.instructor.name,
          instructorRole: dto.instructor.role,
          outcomes: dto.outcomes,
          prerequisiteId: dto.prerequisiteId ?? null,
        },
      });
      await this.curriculumWriter.write(tx, id, dto);
    });

    await this.shared.writeAudit({ action: 'UPDATE', entityId: id, actorId: actor.userId, after: { title: dto.title } });
    return this.read.getForAdmin(id);
  }

  async remove(actor: AuthUser, id: string) {
    const existing = await this.prisma.course.findFirst({ where: { tenantId: this.tenantId, id } });
    if (!existing) throw new NotFoundException('Course not found');
    // Modules/Lessons/ExamQuestions/Enrollments cascade; dependents' prerequisiteId is
    // SET NULL rather than blocked, matching the confirm-delete copy in the admin UI.
    await this.prisma.course.delete({ where: { id } });
    await this.shared.writeAudit({ action: 'DELETE', entityId: id, actorId: actor.userId, after: { title: existing.title } });
    return { id, deleted: true };
  }
}
