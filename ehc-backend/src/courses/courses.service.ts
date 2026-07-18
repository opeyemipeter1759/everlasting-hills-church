import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import slugify from 'slugify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import {
  CourseInputSchema,
  SubmitExamSchema,
  SubmitModuleCheckSchema,
  CourseCategoryInputSchema,
  type CourseInput,
} from './dto/course.schema';

const courseListInclude = {
  Prerequisite: { select: { slug: true, title: true } },
  CategoryRef: { include: { Parent: { select: { id: true, name: true } } } },
  Modules: { select: { Lessons: { select: { id: true } } } },
  ExamQuestions: { select: { id: true } },
  _count: { select: { Enrollments: true } },
} satisfies Prisma.CourseInclude;

type CourseWithCounts = Prisma.CourseGetPayload<{ include: typeof courseListInclude }>;

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private parse<T>(schema: z.ZodType<T>, raw: unknown): T {
    const r = schema.safeParse(raw);
    if (!r.success) {
      throw new BadRequestException({
        message: 'Invalid input',
        details: r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    return r.data;
  }

  private async writeAudit(entry: { action: string; entityId: string; actorId: string; after?: Prisma.InputJsonValue }) {
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

  private toCategoryShape(cat: CourseWithCounts['CategoryRef']) {
    if (!cat) return { id: '', name: 'Uncategorized', parentId: null as string | null, parentName: null as string | null };
    return { id: cat.id, name: cat.name, parentId: cat.parentId, parentName: cat.Parent?.name ?? null };
  }

  private toListItem(c: CourseWithCounts) {
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      tagline: c.tagline,
      category: this.toCategoryShape(c.CategoryRef),
      iconKey: c.iconKey,
      gradient: [c.gradientFrom, c.gradientTo] as [string, string],
      duration: c.duration,
      instructor: { name: c.instructorName, role: c.instructorRole },
      lessonsCount: c.Modules.reduce((n, m) => n + m.Lessons.length, 0),
      studentsCount: c._count.Enrollments,
      examQuestionCount: c.ExamQuestions.length,
      prerequisiteId: c.prerequisiteId,
      prerequisiteSlug: c.Prerequisite?.slug ?? null,
    };
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
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

  private async resolveMemberId(actor: AuthUser): Promise<string> {
    if (actor.memberId) return actor.memberId;
    const member = actor.profileId
      ? await this.prisma.member.findFirst({ where: { tenantId: this.tenantId, profileId: actor.profileId }, select: { id: true } })
      : null;
    if (!member) throw new BadRequestException('No member profile for this account');
    return member.id;
  }

  // ── Reads ────────────────────────────────────────────────────────────────────

  async list() {
    const courses = await this.prisma.course.findMany({
      where: { tenantId: this.tenantId },
      include: courseListInclude,
      orderBy: { createdAt: 'asc' },
    });
    return courses.map((c) => this.toListItem(c));
  }

  /** Member-facing detail — never includes exam correctIndex. */
  async getBySlug(slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { tenantId: this.tenantId, slug },
      include: {
        Prerequisite: { select: { slug: true, title: true } },
        CategoryRef: { include: { Parent: { select: { id: true, name: true } } } },
        Modules: { orderBy: { sortOrder: 'asc' }, include: { Lessons: { orderBy: { sortOrder: 'asc' } } } },
        ExamQuestions: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { Enrollments: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      tagline: course.tagline,
      description: course.description,
      category: this.toCategoryShape(course.CategoryRef),
      iconKey: course.iconKey,
      gradient: [course.gradientFrom, course.gradientTo] as [string, string],
      duration: course.duration,
      instructor: { name: course.instructorName, role: course.instructorRole },
      outcomes: course.outcomes,
      lessonsCount: course.Modules.reduce((n, m) => n + m.Lessons.length, 0),
      studentsCount: course._count.Enrollments,
      curriculum: course.Modules.map((m) => ({
        id: m.id,
        title: m.title,
        lessons: m.Lessons.map((l) => ({ id: l.id, title: l.title, duration: l.duration, videoUrl: l.videoUrl })),
        check: m.checkQuestion ? { question: m.checkQuestion, options: m.checkOptions } : null,
      })),
      prerequisiteSlug: course.Prerequisite?.slug ?? null,
      exam: course.ExamQuestions.map((q) => ({ id: q.id, question: q.question, options: q.options })),
    };
  }

  /** Admin editor detail — includes exam correctIndex and prerequisiteId. */
  async getForAdmin(id: string) {
    const course = await this.prisma.course.findFirst({
      where: { tenantId: this.tenantId, id },
      include: {
        CategoryRef: { include: { Parent: { select: { id: true, name: true } } } },
        Modules: { orderBy: { sortOrder: 'asc' }, include: { Lessons: { orderBy: { sortOrder: 'asc' } } } },
        ExamQuestions: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      tagline: course.tagline,
      description: course.description,
      category: this.toCategoryShape(course.CategoryRef),
      iconKey: course.iconKey,
      gradient: [course.gradientFrom, course.gradientTo] as [string, string],
      duration: course.duration,
      instructor: { name: course.instructorName, role: course.instructorRole },
      outcomes: course.outcomes,
      curriculum: course.Modules.map((m) => ({
        id: m.id,
        title: m.title,
        lessons: m.Lessons.map((l) => ({ id: l.id, title: l.title, duration: l.duration, videoUrl: l.videoUrl })),
        check:
          m.checkQuestion && m.checkCorrectIndex !== null
            ? { question: m.checkQuestion, options: m.checkOptions, correctIndex: m.checkCorrectIndex }
            : null,
      })),
      prerequisiteId: course.prerequisiteId,
      exam: course.ExamQuestions.map((q) => ({ id: q.id, question: q.question, options: q.options, correctIndex: q.correctIndex })),
    };
  }

  // ── Admin: CRUD ──────────────────────────────────────────────────────────────

  private async writeCurriculumAndExam(tx: Prisma.TransactionClient, courseId: string, dto: CourseInput) {
    await tx.courseModule.deleteMany({ where: { courseId } });
    await tx.examQuestion.deleteMany({ where: { courseId } });

    for (const [mi, mod] of dto.curriculum.entries()) {
      const moduleId = randomUUID();
      await tx.courseModule.create({
        data: {
          id: moduleId,
          tenantId: this.tenantId,
          courseId,
          title: mod.title,
          sortOrder: mi,
          checkQuestion: mod.check?.question ?? null,
          checkOptions: mod.check?.options ?? [],
          checkCorrectIndex: mod.check?.correctIndex ?? null,
        },
      });
      for (const [li, lesson] of mod.lessons.entries()) {
        await tx.courseLesson.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            moduleId,
            title: lesson.title,
            duration: lesson.duration,
            videoUrl: lesson.videoUrl || null,
            sortOrder: li,
          },
        });
      }
    }

    for (const [qi, q] of dto.exam.entries()) {
      await tx.examQuestion.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          courseId,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          sortOrder: qi,
        },
      });
    }
  }

  private async assertCategoryExists(categoryId: string) {
    const category = await this.prisma.courseCategory.findFirst({
      where: { id: categoryId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Category not found');
  }

  async create(actor: AuthUser, raw: unknown) {
    const dto = this.parse(CourseInputSchema, raw);
    await this.assertCategoryExists(dto.categoryId);
    const slug = await this.uniqueSlug(dto.title);
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
      await this.writeCurriculumAndExam(tx, id, dto);
    });

    await this.writeAudit({ action: 'CREATE', entityId: id, actorId: actor.userId, after: { title: dto.title } });
    return this.getForAdmin(id);
  }

  async update(actor: AuthUser, id: string, raw: unknown) {
    const dto = this.parse(CourseInputSchema, raw);
    const existing = await this.prisma.course.findFirst({ where: { tenantId: this.tenantId, id } });
    if (!existing) throw new NotFoundException('Course not found');
    await this.assertCategoryExists(dto.categoryId);

    if (dto.prerequisiteId === id) {
      throw new BadRequestException('A course cannot be its own prerequisite');
    }

    const slug = dto.title === existing.title ? existing.slug : await this.uniqueSlug(dto.title, id);

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
      await this.writeCurriculumAndExam(tx, id, dto);
    });

    await this.writeAudit({ action: 'UPDATE', entityId: id, actorId: actor.userId, after: { title: dto.title } });
    return this.getForAdmin(id);
  }

  async remove(actor: AuthUser, id: string) {
    const existing = await this.prisma.course.findFirst({ where: { tenantId: this.tenantId, id } });
    if (!existing) throw new NotFoundException('Course not found');
    // Modules/Lessons/ExamQuestions/Enrollments cascade; dependents' prerequisiteId is
    // SET NULL rather than blocked, matching the confirm-delete copy in the admin UI.
    await this.prisma.course.delete({ where: { id } });
    await this.writeAudit({ action: 'DELETE', entityId: id, actorId: actor.userId, after: { title: existing.title } });
    return { id, deleted: true };
  }

  // ── Admin: category CRUD ─────────────────────────────────────────────────────

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
      parentId: c.parentId,
      courseCount: courseCountByCategory.get(c.id) ?? 0,
    }));
  }

  private async uniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
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

  async createCategory(actor: AuthUser, raw: unknown) {
    const dto = this.parse(CourseCategoryInputSchema, raw);
    if (dto.parentId) await this.assertCategoryExists(dto.parentId);

    const id = randomUUID();
    const slug = await this.uniqueCategorySlug(dto.name);
    await this.prisma.courseCategory.create({
      data: { id, tenantId: this.tenantId, name: dto.name, slug, parentId: dto.parentId ?? null },
    });
    await this.writeAudit({ action: 'CREATE', entityId: id, actorId: actor.userId, after: { name: dto.name } });
    return this.listCategories();
  }

  async updateCategory(actor: AuthUser, id: string, raw: unknown) {
    const dto = this.parse(CourseCategoryInputSchema, raw);
    const existing = await this.prisma.courseCategory.findFirst({ where: { tenantId: this.tenantId, id } });
    if (!existing) throw new NotFoundException('Category not found');
    if (dto.parentId === id) throw new BadRequestException('A category cannot be its own parent');
    if (dto.parentId) await this.assertCategoryExists(dto.parentId);

    const slug = dto.name === existing.name ? existing.slug : await this.uniqueCategorySlug(dto.name, id);
    await this.prisma.courseCategory.update({
      where: { id },
      data: { name: dto.name, slug, parentId: dto.parentId ?? null },
    });
    await this.writeAudit({ action: 'UPDATE', entityId: id, actorId: actor.userId, after: { name: dto.name } });
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
    await this.writeAudit({ action: 'DELETE', entityId: id, actorId: actor.userId, after: { name: existing.name } });
    return { id, deleted: true };
  }

  // ── Member: enrollment + exam ────────────────────────────────────────────────

  async myProgress(actor: AuthUser) {
    const memberId = await this.resolveMemberId(actor).catch(() => null);
    if (!memberId) return {};
    const rows = await this.prisma.courseEnrollment.findMany({ where: { tenantId: this.tenantId, memberId } });
    const map: Record<
      string,
      {
        enrolled: boolean;
        completed: boolean;
        completedAt: string | null;
        lastScorePct: number | null;
        attempts: number;
        watchedLessonIds: string[];
        passedModuleIds: string[];
      }
    > = {};
    for (const r of rows) {
      map[r.courseId] = {
        enrolled: true,
        completed: r.completed,
        completedAt: r.completedAt?.toISOString() ?? null,
        lastScorePct: r.lastScorePct,
        attempts: r.attempts,
        watchedLessonIds: r.watchedLessonIds,
        passedModuleIds: r.passedModuleIds,
      };
    }
    return map;
  }

  /** Marks a lesson watched to completion for the current member (idempotent). */
  async markLessonWatched(actor: AuthUser, courseId: string, lessonId: string) {
    const memberId = await this.resolveMemberId(actor);

    const lesson = await this.prisma.courseLesson.findFirst({
      where: { id: lessonId, tenantId: this.tenantId, Module: { courseId } },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found on this course');

    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_memberId: { courseId, memberId } },
    });
    if (!enrollment) throw new BadRequestException('Enroll in this course first');

    if (!enrollment.watchedLessonIds.includes(lessonId)) {
      await this.prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: { watchedLessonIds: { push: lessonId } },
      });
    }

    return { lessonId, watched: true };
  }

  /**
   * Grades a module's checkpoint question server-side, same non-reveal contract as
   * submitExam — checkCorrectIndex is never sent to the client, only whether the
   * submitted answer was right.
   */
  async submitModuleCheck(actor: AuthUser, courseId: string, moduleId: string, raw: unknown) {
    const dto = this.parse(SubmitModuleCheckSchema, raw);
    const memberId = await this.resolveMemberId(actor);

    const mod = await this.prisma.courseModule.findFirst({
      where: { id: moduleId, tenantId: this.tenantId, courseId },
      select: { checkCorrectIndex: true },
    });
    if (!mod) throw new NotFoundException('Module not found on this course');
    if (mod.checkCorrectIndex === null) throw new BadRequestException('This module has no checkpoint question');

    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_memberId: { courseId, memberId } },
    });
    if (!enrollment) throw new BadRequestException('Enroll in this course first');

    const correct = dto.answer === mod.checkCorrectIndex;
    const alreadyPassed = enrollment.passedModuleIds.includes(moduleId);
    if (correct && !alreadyPassed) {
      await this.prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: { passedModuleIds: { push: moduleId } },
      });
    }

    return { correct, passed: correct || alreadyPassed };
  }

  async enroll(actor: AuthUser, courseId: string) {
    const course = await this.prisma.course.findFirst({ where: { tenantId: this.tenantId, id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const memberId = await this.resolveMemberId(actor);

    if (course.prerequisiteId) {
      const prereq = await this.prisma.courseEnrollment.findFirst({
        where: { courseId: course.prerequisiteId, memberId, completed: true },
      });
      if (!prereq) throw new BadRequestException('Complete the prerequisite course first');
    }

    await this.prisma.courseEnrollment.upsert({
      where: { courseId_memberId: { courseId, memberId } },
      create: { id: randomUUID(), tenantId: this.tenantId, courseId, memberId },
      update: {},
    });
    return { courseId, enrolled: true };
  }

  async submitExam(actor: AuthUser, courseId: string, raw: unknown) {
    const dto = this.parse(SubmitExamSchema, raw);
    const memberId = await this.resolveMemberId(actor);

    const questions = await this.prisma.examQuestion.findMany({ where: { tenantId: this.tenantId, courseId } });
    if (questions.length === 0) throw new BadRequestException('This course has no exam');

    const correct = questions.filter((q) => dto.answers[q.id] === q.correctIndex).length;
    const scorePct = Math.round((correct / questions.length) * 100);

    const existing = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_memberId: { courseId, memberId } },
    });
    const enrollment = await this.prisma.courseEnrollment.upsert({
      where: { courseId_memberId: { courseId, memberId } },
      create: {
        id: randomUUID(),
        tenantId: this.tenantId,
        courseId,
        memberId,
        attempts: 1,
        lastScorePct: scorePct,
        completed: scorePct === 100,
        completedAt: scorePct === 100 ? new Date() : null,
      },
      update: {
        attempts: { increment: 1 },
        lastScorePct: scorePct,
        completed: existing?.completed || scorePct === 100,
        completedAt: existing?.completed || scorePct === 100 ? new Date() : undefined,
      },
    });

    // Correct answers are never sent to the client — not on the pre-submission read
    // (getBySlug strips correctIndex) and not here either, so a failed attempt can't
    // be used to look up the right answers before retaking.
    return {
      scorePct,
      correct,
      total: questions.length,
      completed: enrollment.completed,
    };
  }
}
