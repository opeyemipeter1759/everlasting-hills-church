import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrollmentStatus, MembershipStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { MembershipService } from './membership.service';
import { chooseCohort, classComplete, eligibility, gradeQuiz, lessonComplete } from './class-rules';

export type LessonStatus = 'locked' | 'not_started' | 'in_progress' | 'done';

export interface Scripture {
  ref: string;
  text?: string;
}

const LESSON_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  duration: true,
  videoUrl: true,
  outcome: true,
  summary: true,
  reflectionPrompt: true,
  scriptures: true,
  actionStep: true,
  actionVerification: true,
  sortOrder: true,
  _count: { select: { QuizItems: true } },
} as const;

type LoadedLesson = Prisma.CourseLessonGetPayload<{ select: typeof LESSON_SELECT }>;

function scripturesOf(raw: Prisma.JsonValue): Scripture[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Prisma.JsonObject => !!s && typeof s === 'object' && !Array.isArray(s))
    .map((s) => ({ ref: String(s.ref ?? '').trim(), text: typeof s.text === 'string' ? s.text : undefined }))
    .filter((s) => s.ref);
}

function requirements(l: LoadedLesson) {
  return {
    hasVideo: !!l.videoUrl?.trim(),
    quizCount: l._count.QuizItems,
    hasReflection: !!l.reflectionPrompt?.trim(),
    // Action steps are retired: no lesson waits on one, whatever text an older lesson still carries.
    hasAction: false,
  };
}

/**
 * A learner's side of the classes: the list, a class's home, enrolling, the
 * lesson player and its progress, and the certificate. Access comes from the
 * enrollment row, never from a role. Quiz answers stay on the server.
 */
@Injectable()
export class ClassesLearnerService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private memberIdOf(actor: AuthUser): string {
    if (!actor.memberId) throw new ForbiddenException('Your account has no member record yet. Contact the church office.');
    return actor.memberId;
  }

  private async loadClass(slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { tenantId: this.tenantId, slug, isClass: true },
      select: {
        id: true,
        slug: true,
        title: true,
        tagline: true,
        description: true,
        duration: true,
        eligibilitySundays: true,
        requiresFullMembership: true,
        grantsMembership: true,
        prerequisiteId: true,
        Prerequisite: { select: { id: true, title: true, slug: true } },
        Modules: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            subtitle: true,
            stage: true,
            Lessons: { orderBy: { sortOrder: 'asc' }, select: LESSON_SELECT },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Class not found');
    const lessons = course.Modules.flatMap((m, wi) => m.Lessons.map((l, li) => ({ lesson: l, week: wi + 1, number: li + 1 })));
    return { course, lessons };
  }

  /** Present check-ins at Sunday services that were not cancelled. */
  async sundayCheckins(memberId: string): Promise<number> {
    return this.prisma.attendanceRecord.count({
      where: { memberId, present: true, Service: { serviceType: 'SUNDAY', cancelledAt: null } },
    });
  }

  private async memberState(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { creditedSundays: true, membershipStatus: true, firstName: true, lastName: true },
    });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  private async enrollmentOf(courseId: string, memberId: string) {
    return this.prisma.courseEnrollment.findUnique({
      where: { courseId_memberId: { courseId, memberId } },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        completedAt: true,
        lastActivityAt: true,
        cohortId: true,
        Cohort: {
          select: {
            id: true,
            name: true,
            startsOn: true,
            minSessions: true,
            Sessions: { orderBy: { startsAt: 'asc' }, select: { id: true, title: true, weekNumber: true, startsAt: true, location: true } },
          },
        },
        Progress: { select: { lessonId: true, videoDoneAt: true, quizPassedAt: true, quizScorePct: true, reflectionAt: true, completedAt: true } },
      },
    });
  }

  /** A learner who has become eligible is let in, and placed in a cohort if they have none. */
  private async promoteIfEligible(courseId: string, enrollment: { id: string; status: EnrollmentStatus; cohortId: string | null }, eligible: boolean, el: ReturnType<typeof eligibility>) {
    if (enrollment.status !== EnrollmentStatus.WAITING || !eligible) return false;
    const cohorts = await this.prisma.classCohort.findMany({ where: { courseId }, select: { id: true, startsOn: true, status: true } });
    const cohort = enrollment.cohortId ? null : chooseCohort(cohorts, el, new Date());
    await this.prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: { status: EnrollmentStatus.ACTIVE, ...(cohort ? { cohortId: cohort.id } : {}) },
    });
    return true;
  }

  private statuses(lessons: { lesson: LoadedLesson }[], progress: Map<string, { completedAt: Date | null; started: boolean }>, open: boolean) {
    const out = new Map<string, LessonStatus>();
    let previousDone = true;
    for (const { lesson } of lessons) {
      const p = progress.get(lesson.id);
      const status: LessonStatus = !open
        ? 'locked'
        : p?.completedAt
          ? 'done'
          : !previousDone
            ? 'locked'
            : p?.started
              ? 'in_progress'
              : 'not_started';
      out.set(lesson.id, status);
      previousDone = status === 'done';
    }
    return out;
  }

  private progressMap(enrollment: NonNullable<Awaited<ReturnType<ClassesLearnerService['enrollmentOf']>>> | null) {
    const map = new Map<string, { completedAt: Date | null; started: boolean }>();
    for (const p of enrollment?.Progress ?? []) {
      map.set(p.lessonId, {
        completedAt: p.completedAt,
        started: !!(p.videoDoneAt || p.quizScorePct != null || p.reflectionAt),
      });
    }
    return map;
  }

  /** Every class with where this member stands in it. */
  async list(actor: AuthUser) {
    const memberId = this.memberIdOf(actor);
    const [member, sundays, courses] = await Promise.all([
      this.memberState(memberId),
      this.sundayCheckins(memberId),
      this.prisma.course.findMany({
        where: { tenantId: this.tenantId, isClass: true },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          tagline: true,
          duration: true,
          eligibilitySundays: true,
          requiresFullMembership: true,
          prerequisiteId: true,
          Modules: { select: { _count: { select: { Lessons: true } } } },
          Enrollments: {
            where: { memberId },
            select: { status: true, completedAt: true, cohortId: true, _count: { select: { Progress: { where: { completedAt: { not: null } } } } } },
          },
        },
      }),
    ]);
    const completedIds = new Set(courses.filter((c) => c.Enrollments[0]?.status === EnrollmentStatus.COMPLETED).map((c) => c.id));
    return {
      membershipStatus: member.membershipStatus,
      classes: courses.map((c) => {
        const total = c.Modules.reduce((n, m) => n + m._count.Lessons, 0);
        const e = c.Enrollments[0];
        const el = eligibility(c.eligibilitySundays, sundays, member.creditedSundays);
        const done = e?._count.Progress ?? 0;
        return {
          slug: c.slug,
          title: c.title,
          tagline: c.tagline,
          duration: c.duration,
          totalLessons: total,
          eligibility: el,
          requiresFullMembership: c.requiresFullMembership,
          prerequisiteMet: !c.prerequisiteId || completedIds.has(c.prerequisiteId),
          enrollment: e ? { status: e.status, completedLessons: done, progressPct: total ? Math.round((done / total) * 100) : 0, completedAt: e.completedAt } : null,
        };
      }),
    };
  }

  /** The class home: outline with lesson statuses, progress, next session and the action checklist. */
  async home(actor: AuthUser, slug: string) {
    const memberId = this.memberIdOf(actor);
    const { course, lessons } = await this.loadClass(slug);
    const [member, sundays] = await Promise.all([this.memberState(memberId), this.sundayCheckins(memberId)]);
    const el = eligibility(course.eligibilitySundays, sundays, member.creditedSundays);
    let enrollment = await this.enrollmentOf(course.id, memberId);
    if (enrollment && (await this.promoteIfEligible(course.id, enrollment, el.eligible, el))) {
      enrollment = await this.enrollmentOf(course.id, memberId);
    }
    const prerequisiteMet = !course.prerequisiteId
      ? true
      : !!(await this.prisma.courseEnrollment.findFirst({
          where: { courseId: course.prerequisiteId, memberId, status: EnrollmentStatus.COMPLETED },
          select: { id: true },
        }));
    const open = !!enrollment && enrollment.status !== EnrollmentStatus.WAITING;
    const progress = this.progressMap(enrollment);
    const statuses = this.statuses(lessons, progress, open);
    const completed = lessons.filter((l) => statuses.get(l.lesson.id) === 'done').length;
    const next = lessons.find((l) => statuses.get(l.lesson.id) !== 'done' && statuses.get(l.lesson.id) !== 'locked');
    const now = Date.now();
    const sessions = enrollment?.Cohort?.Sessions ?? [];
    const attended = enrollment
      ? await this.prisma.sessionAttendance.count({ where: { memberId, sessionId: { in: sessions.map((s) => s.id) } } })
      : 0;

    let blocker: string | null = null;
    if (!enrollment) {
      if (course.requiresFullMembership && member.membershipStatus !== MembershipStatus.FULL) blocker = 'This class is for full members.';
      else if (!prerequisiteMet) blocker = `Finish ${course.Prerequisite?.title ?? 'the class before this one'} first.`;
    }

    return {
      class: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        tagline: course.tagline,
        description: course.description,
        duration: course.duration,
        grantsMembership: course.grantsMembership,
        weeks: course.Modules.map((m, wi) => ({
          number: wi + 1,
          title: m.title,
          subtitle: m.subtitle,
          stage: m.stage,
          lessons: m.Lessons.map((l, li) => ({
            id: l.id,
            slug: l.slug ?? l.id,
            number: li + 1,
            title: l.title,
            description: l.description,
            status: statuses.get(l.id) ?? 'locked',
          })),
        })),
      },
      membershipStatus: member.membershipStatus,
      eligibility: el,
      prerequisite: course.Prerequisite ? { title: course.Prerequisite.title, slug: course.Prerequisite.slug, met: prerequisiteMet } : null,
      canEnroll: !enrollment && !blocker,
      blocker,
      enrollment: enrollment
        ? {
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
            completedAt: enrollment.completedAt,
            completedLessons: completed,
            totalLessons: lessons.length,
            progressPct: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
            currentWeek: next?.week ?? (lessons.length ? lessons[lessons.length - 1].week : 1),
            next: next ? { week: next.week, slug: next.lesson.slug ?? next.lesson.id, title: next.lesson.title } : null,
            cohort: enrollment.Cohort
              ? {
                  name: enrollment.Cohort.name,
                  startsOn: enrollment.Cohort.startsOn,
                  minSessions: enrollment.Cohort.minSessions,
                  sessionsAttended: attended,
                  nextSession: sessions.find((s) => s.startsAt.getTime() >= now - 2 * 60 * 60 * 1000) ?? null,
                }
              : null,
          }
        : null,
    };
  }

  /** Just enough for the public page's buttons: eligibility and progress. */
  async status(actor: AuthUser, slug: string) {
    const home = await this.home(actor, slug);
    return {
      eligibility: home.eligibility,
      membershipStatus: home.membershipStatus,
      canEnroll: home.canEnroll,
      enrollment: home.enrollment
        ? { status: home.enrollment.status, progressPct: home.enrollment.progressPct, currentWeek: home.enrollment.currentWeek, next: home.enrollment.next }
        : null,
    };
  }

  async enroll(actor: AuthUser, slug: string) {
    const memberId = this.memberIdOf(actor);
    const { course } = await this.loadClass(slug);
    const existing = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_memberId: { courseId: course.id, memberId } },
      select: { id: true },
    });
    if (existing) return this.home(actor, slug);
    const [member, sundays] = await Promise.all([this.memberState(memberId), this.sundayCheckins(memberId)]);
    if (course.requiresFullMembership && member.membershipStatus !== MembershipStatus.FULL) {
      throw new ForbiddenException('This class is for full members.');
    }
    if (course.prerequisiteId) {
      const done = await this.prisma.courseEnrollment.findFirst({
        where: { courseId: course.prerequisiteId, memberId, status: EnrollmentStatus.COMPLETED },
        select: { id: true },
      });
      if (!done) throw new ForbiddenException(`Finish ${course.Prerequisite?.title ?? 'the class before this one'} first.`);
    }
    const el = eligibility(course.eligibilitySundays, sundays, member.creditedSundays);
    const cohorts = await this.prisma.classCohort.findMany({ where: { courseId: course.id }, select: { id: true, startsOn: true, status: true } });
    const cohort = chooseCohort(cohorts, el, new Date());
    await this.prisma.courseEnrollment.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        courseId: course.id,
        memberId,
        cohortId: cohort?.id ?? null,
        status: el.eligible ? EnrollmentStatus.ACTIVE : EnrollmentStatus.WAITING,
        lastActivityAt: new Date(),
      },
    });
    return this.home(actor, slug);
  }

  /** Loads a lesson for a learner who may open it. */
  private async openLesson(actor: AuthUser, slug: string, lessonRef: string) {
    const memberId = this.memberIdOf(actor);
    const { course, lessons } = await this.loadClass(slug);
    const index = lessons.findIndex((l) => l.lesson.id === lessonRef || l.lesson.slug === lessonRef);
    if (index < 0) throw new NotFoundException('Lesson not found');
    const enrollment = await this.enrollmentOf(course.id, memberId);
    if (!enrollment || enrollment.status === EnrollmentStatus.WAITING) {
      throw new ForbiddenException('Enroll in the class, and be eligible, to open its lessons.');
    }
    const statuses = this.statuses(lessons, this.progressMap(enrollment), true);
    const entry = lessons[index];
    if (statuses.get(entry.lesson.id) === 'locked' && enrollment.status !== EnrollmentStatus.COMPLETED) {
      throw new ForbiddenException('Finish the lesson before this one first.');
    }
    return { course, lessons, index, entry, enrollment, memberId, statuses };
  }

  async lesson(actor: AuthUser, slug: string, lessonRef: string) {
    const { course, lessons, index, entry, enrollment, statuses } = await this.openLesson(actor, slug, lessonRef);
    const l = entry.lesson;
    const [quiz, progress] = await Promise.all([
      this.prisma.lessonQuizItem.findMany({
        where: { lessonId: l.id },
        orderBy: { sortOrder: 'asc' },
        // correctIndex is deliberately not selected: it never leaves the server.
        select: { id: true, prompt: true, options: true },
      }),
      this.prisma.lessonProgress.findUnique({ where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: l.id } } }),
    ]);
    const ref = (i: number) =>
      lessons[i] ? { week: lessons[i].week, slug: lessons[i].lesson.slug ?? lessons[i].lesson.id, title: lessons[i].lesson.title } : null;
    return {
      class: { slug: course.slug, title: course.title },
      lesson: {
        id: l.id,
        slug: l.slug ?? l.id,
        week: entry.week,
        number: entry.number,
        weekTitle: course.Modules[entry.week - 1]?.title ?? null,
        title: l.title,
        description: l.description,
        duration: l.duration,
        outcome: l.outcome,
        videoUrl: l.videoUrl,
        scriptures: scripturesOf(l.scriptures),
        summary: l.summary,
        reflectionPrompt: l.reflectionPrompt,
        quiz,
      },
      progress: {
        status: statuses.get(l.id) ?? 'not_started',
        videoDone: !!progress?.videoDoneAt,
        quizScorePct: progress?.quizScorePct ?? null,
        quizPassed: !!progress?.quizPassedAt,
        quizAttempts: progress?.quizAttempts ?? 0,
        reflection: progress?.reflection ?? '',
        completed: !!progress?.completedAt,
      },
      previous: ref(index - 1),
      next: ref(index + 1),
    };
  }

  /** Saves part of a lesson, then works out whether the lesson and the class are complete. */
  private async touch(
    ctx: Awaited<ReturnType<ClassesLearnerService['openLesson']>>,
    patch: Prisma.LessonProgressUpdateInput,
    create: Partial<Prisma.LessonProgressUncheckedCreateInput> = {},
  ) {
    const { enrollment, entry } = ctx;
    const now = new Date();
    const saved = await this.prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: entry.lesson.id } },
      create: { id: randomUUID(), tenantId: this.tenantId, enrollmentId: enrollment.id, lessonId: entry.lesson.id, ...create },
      update: patch,
    });
    const done = lessonComplete(requirements(entry.lesson), {
      videoDone: !!saved.videoDoneAt,
      quizPassed: !!saved.quizPassedAt,
      reflected: !!saved.reflectionAt,
      actionDone: false,
    });
    if (done && !saved.completedAt) {
      await this.prisma.lessonProgress.update({ where: { id: saved.id }, data: { completedAt: now } });
    }
    await this.prisma.courseEnrollment.update({ where: { id: enrollment.id }, data: { lastActivityAt: now, stalledNotifiedAt: null } });
    if (done) await this.checkClassComplete(ctx);
    return done;
  }

  private async checkClassComplete(ctx: Awaited<ReturnType<ClassesLearnerService['openLesson']>>) {
    const { enrollment, lessons, course, memberId } = ctx;
    if (enrollment.status === EnrollmentStatus.COMPLETED) return;
    const completedLessons = await this.prisma.lessonProgress.count({ where: { enrollmentId: enrollment.id, completedAt: { not: null } } });
    const sessionIds = enrollment.Cohort?.Sessions.map((s) => s.id) ?? [];
    const attended = sessionIds.length
      ? await this.prisma.sessionAttendance.count({ where: { memberId, sessionId: { in: sessionIds } } })
      : 0;
    if (!classComplete(lessons.length, completedLessons, enrollment.Cohort?.minSessions ?? 0, attended)) return;
    await this.prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: { status: EnrollmentStatus.COMPLETED, completed: true, completedAt: new Date() },
    });
    if (course.grantsMembership) await this.membership.raiseApproval(memberId, course.id, enrollment.id);
  }

  /** Re-checks completion when a session is marked attended after the lessons were done. */
  async recheckEnrollment(enrollmentId: string) {
    const e = await this.prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { memberId: true, Course: { select: { slug: true } } },
    });
    if (!e) return;
    const lessons = await this.loadClass(e.Course.slug);
    const enrollment = await this.enrollmentOf(lessons.course.id, e.memberId);
    if (!enrollment) return;
    await this.checkClassComplete({
      course: lessons.course,
      lessons: lessons.lessons,
      enrollment,
      memberId: e.memberId,
      index: 0,
      entry: lessons.lessons[0],
      statuses: new Map(),
    });
  }

  async markVideo(actor: AuthUser, slug: string, lessonRef: string) {
    const ctx = await this.openLesson(actor, slug, lessonRef);
    const now = new Date();
    const completed = await this.touch(ctx, { videoDoneAt: now }, { videoDoneAt: now });
    return { videoDone: true, completed };
  }

  async submitQuiz(actor: AuthUser, slug: string, lessonRef: string, answers: (number | null)[]) {
    const ctx = await this.openLesson(actor, slug, lessonRef);
    const items = await this.prisma.lessonQuizItem.findMany({
      where: { lessonId: ctx.entry.lesson.id },
      orderBy: { sortOrder: 'asc' },
      select: { correctIndex: true },
    });
    if (!items.length) throw new BadRequestException('This lesson has no quiz.');
    const graded = gradeQuiz(
      items.map((i) => i.correctIndex),
      answers,
    );
    const now = new Date();
    const completed = await this.touch(
      ctx,
      { quizScorePct: graded.scorePct, quizAttempts: { increment: 1 }, ...(graded.passed ? { quizPassedAt: now } : {}) },
      { quizScorePct: graded.scorePct, quizAttempts: 1, quizPassedAt: graded.passed ? now : null },
    );
    return { scorePct: graded.scorePct, passed: graded.passed, right: graded.right, total: graded.total, results: graded.results, completed };
  }

  async saveReflection(actor: AuthUser, slug: string, lessonRef: string, text: string) {
    const ctx = await this.openLesson(actor, slug, lessonRef);
    const body = text.trim();
    const now = new Date();
    const completed = await this.touch(
      ctx,
      { reflection: body || null, reflectionAt: body ? now : null },
      { reflection: body || null, reflectionAt: body ? now : null },
    );
    return { saved: true, completed };
  }

  async certificate(actor: AuthUser, slug: string) {
    const memberId = this.memberIdOf(actor);
    const { course } = await this.loadClass(slug);
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_memberId: { courseId: course.id, memberId } },
      select: { status: true, completedAt: true },
    });
    if (enrollment?.status !== EnrollmentStatus.COMPLETED) throw new ForbiddenException('Finish the class to see your certificate.');
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { firstName: true, lastName: true, membershipStatus: true, membershipConfirmedAt: true },
    });
    return {
      name: `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim(),
      classTitle: course.title,
      completedAt: enrollment.completedAt,
      grantsMembership: course.grantsMembership,
      membershipStatus: member?.membershipStatus ?? MembershipStatus.IN_TRAINING,
      membershipConfirmedAt: member?.membershipConfirmedAt ?? null,
    };
  }
}
