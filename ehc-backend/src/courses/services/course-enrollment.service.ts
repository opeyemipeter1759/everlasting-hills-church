import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { SubmitExamSchema, CourseCategoryEnrollInputSchema } from '../dto/course.schema';
import { CoursesSharedService } from './courses-shared.service';

@Injectable()
export class CourseEnrollmentService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: CoursesSharedService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async enroll(actor: AuthUser, courseId: string) {
    const course = await this.prisma.course.findFirst({ where: { tenantId: this.tenantId, id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const memberId = await this.shared.resolveMemberId(actor);

    // Category access is the outermost gate — a member must have already enrolled
    // in the course's category (reason + agreement form) before enrolling in any
    // individual course inside it. Enforced here (not just in the UI) so hitting
    // POST /courses/:id/enroll directly can't bypass the category form.
    if (course.categoryId) {
      const categoryEnrollment = await this.prisma.courseCategoryEnrollment.findUnique({
        where: { categoryId_memberId: { categoryId: course.categoryId, memberId } },
      });
      if (!categoryEnrollment) throw new BadRequestException('Enroll in this course\'s category first');
    }

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
    const dto = parseSchema(SubmitExamSchema, raw);
    const memberId = await this.shared.resolveMemberId(actor);

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

  async enrollInCategory(actor: AuthUser, categoryId: string, raw: unknown) {
    const dto = parseSchema(CourseCategoryEnrollInputSchema, raw);
    await this.shared.assertCategoryExists(categoryId);
    const memberId = await this.shared.resolveMemberId(actor);

    await this.prisma.courseCategoryEnrollment.upsert({
      where: { categoryId_memberId: { categoryId, memberId } },
      create: {
        id: randomUUID(),
        tenantId: this.tenantId,
        categoryId,
        memberId,
        reason: dto.reason,
        commitmentConfirmed: dto.commitmentConfirmed,
        agreedToRules: dto.agreedToRules,
      },
      update: {},
    });
    return { categoryId, enrolled: true };
  }

  async myEnrolledCategoryIds(actor: AuthUser): Promise<string[]> {
    const memberId = await this.shared.resolveMemberId(actor);
    const rows = await this.prisma.courseCategoryEnrollment.findMany({
      where: { memberId },
      select: { categoryId: true },
    });
    return rows.map((r) => r.categoryId);
  }
}
