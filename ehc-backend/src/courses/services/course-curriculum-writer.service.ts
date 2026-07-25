import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import type { Env } from '../../config/env.validation';
import type { CourseInput } from '../dto/course.schema';

/** Replaces a course's modules/lessons/exam questions wholesale on create/update. */
@Injectable()
export class CourseCurriculumWriterService {
  private readonly tenantId: string;

  constructor(config: ConfigService<Env, true>) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async write(tx: Prisma.TransactionClient, courseId: string, dto: CourseInput) {
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
}
