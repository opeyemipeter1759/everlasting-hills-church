import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { courseListInclude, toCategoryShape, toListItem } from '../courses.util';

@Injectable()
export class CoursesReadService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list() {
    const courses = await this.prisma.course.findMany({
      where: { tenantId: this.tenantId },
      include: courseListInclude,
      orderBy: { createdAt: 'asc' },
    });
    return courses.map((c) => toListItem(c));
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
      category: toCategoryShape(course.CategoryRef),
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
      category: toCategoryShape(course.CategoryRef),
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
}
