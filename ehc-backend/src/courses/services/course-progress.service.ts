import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { SubmitModuleCheckSchema } from '../dto/course.schema';
import { CoursesSharedService } from './courses-shared.service';

/** A member's lesson-watch and module-checkpoint progress within a course. */
@Injectable()
export class CourseProgressService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: CoursesSharedService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async myProgress(actor: AuthUser) {
    const memberId = await this.shared.resolveMemberId(actor).catch(() => null);
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
    const memberId = await this.shared.resolveMemberId(actor);

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
    const dto = parseSchema(SubmitModuleCheckSchema, raw);
    const memberId = await this.shared.resolveMemberId(actor);

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
}
