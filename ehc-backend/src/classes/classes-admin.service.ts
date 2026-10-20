import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ActionVerification, EnrollmentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InboxService } from '../inbox/inbox.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { isStaff } from '../auth/policy/staff';
import { ClassesLearnerService } from './classes-learner.service';
import { isStalled } from './class-rules';
import { VIDEO_SOURCE, type VideoSource } from './video-source';

export interface LessonContentInput {
  title?: string;
  description?: string | null;
  duration?: string;
  outcome?: string | null;
  videoUrl?: string | null;
  durationSeconds?: number | null;
  summary?: string | null;
  reflectionPrompt?: string | null;
  scriptures?: { ref: string; text?: string }[];
  actionStep?: string | null;
  actionVerification?: ActionVerification;
}

const memberName = (m: { firstName: string; lastName: string }) => `${m.firstName} ${m.lastName}`.trim();
const nullable = (v: string | null | undefined) => (v === undefined ? undefined : v?.trim() || null);

/**
 * Running the classes: lesson content, cohorts and their sessions and
 * facilitators, rosters with progress, session attendance, action-step
 * verification, enrolling someone by exception, and stalled learners.
 *
 * Pastors and admins can do all of it. A facilitator can see and work the
 * cohorts they facilitate, and nothing else.
 */
@Injectable()
export class ClassesAdminService {
  private readonly logger = new Logger(ClassesAdminService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    private readonly learner: ClassesLearnerService,
    @Inject(VIDEO_SOURCE) private readonly video: VideoSource,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private assertStaff(actor: AuthUser) {
    if (!isStaff(actor)) throw new ForbiddenException('Only pastors and admins can do this');
  }

  /** Staff, or a facilitator of this cohort. */
  private async assertCohortAccess(actor: AuthUser, cohortId: string) {
    const cohort = await this.prisma.classCohort.findFirst({ where: { id: cohortId, tenantId: this.tenantId }, select: { id: true } });
    if (!cohort) throw new NotFoundException('Cohort not found');
    if (isStaff(actor)) return;
    const facilitates = actor.memberId
      ? await this.prisma.cohortFacilitator.findUnique({ where: { cohortId_memberId: { cohortId, memberId: actor.memberId } }, select: { id: true } })
      : null;
    if (!facilitates) throw new ForbiddenException('You do not facilitate this cohort');
  }

  // ── Classes and content ──────────────────────────────────────────────────

  async classes(actor: AuthUser) {
    this.assertStaff(actor);
    const rows = await this.prisma.course.findMany({
      where: { tenantId: this.tenantId, isClass: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        tagline: true,
        eligibilitySundays: true,
        grantsMembership: true,
        requiresFullMembership: true,
        Modules: { select: { _count: { select: { Lessons: true } } } },
        _count: { select: { Cohorts: true } },
        Enrollments: { select: { status: true } },
      },
    });
    return rows.map(({ Modules, _count, Enrollments, ...c }) => ({
      ...c,
      lessons: Modules.reduce((n, m) => n + m._count.Lessons, 0),
      cohorts: _count.Cohorts,
      learners: {
        pending: Enrollments.filter((e) => e.status === EnrollmentStatus.PENDING).length,
        waiting: Enrollments.filter((e) => e.status === EnrollmentStatus.WAITING).length,
        active: Enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE).length,
        completed: Enrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED).length,
      },
    }));
  }

  /** Full content, quiz answers included: staff only. */
  async content(actor: AuthUser, courseId: string) {
    this.assertStaff(actor);
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId: this.tenantId, isClass: true },
      select: {
        id: true,
        slug: true,
        title: true,
        Modules: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            subtitle: true,
            stage: true,
            Lessons: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                duration: true,
                outcome: true,
                videoUrl: true,
                durationSeconds: true,
                summary: true,
                reflectionPrompt: true,
                scriptures: true,
                actionStep: true,
                actionVerification: true,
                QuizItems: { orderBy: { sortOrder: 'asc' }, select: { id: true, prompt: true, options: true, correctIndex: true } },
              },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Class not found');
    return course;
  }

  private async lessonOrThrow(lessonId: string) {
    const lesson = await this.prisma.courseLesson.findFirst({
      where: { id: lessonId, tenantId: this.tenantId, Module: { Course: { isClass: true } } },
      select: { id: true, videoUrl: true, durationSeconds: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async updateLesson(actor: AuthUser, lessonId: string, input: LessonContentInput) {
    this.assertStaff(actor);
    const existing = await this.lessonOrThrow(lessonId);
    const scriptures = input.scriptures
      ?.map((s) => ({ ref: s.ref.trim(), ...(s.text?.trim() ? { text: s.text.trim() } : {}) }))
      .filter((s) => s.ref);
    if (input.videoUrl && !/^https:\/\//i.test(input.videoUrl.trim())) {
      throw new BadRequestException('The video link must start with https://');
    }
    // The watch rules measure against the video's length, which comes from the video host or an admin, never from a learner.
    let durationSeconds: number | null | undefined;
    if (input.durationSeconds !== undefined) {
      durationSeconds = input.durationSeconds;
    } else if (input.videoUrl !== undefined) {
      const url = nullable(input.videoUrl);
      if (!url) durationSeconds = null;
      else if (url !== existing.videoUrl?.trim() || !existing.durationSeconds) durationSeconds = await this.video.durationSeconds(url);
    }
    return this.prisma.courseLesson.update({
      where: { id: lessonId },
      data: {
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
        ...(input.title?.trim() ? { title: input.title.trim() } : {}),
        ...(input.duration?.trim() ? { duration: input.duration.trim() } : {}),
        description: nullable(input.description),
        outcome: nullable(input.outcome),
        videoUrl: nullable(input.videoUrl),
        summary: nullable(input.summary),
        reflectionPrompt: nullable(input.reflectionPrompt),
        actionStep: nullable(input.actionStep),
        ...(input.actionVerification ? { actionVerification: input.actionVerification } : {}),
        ...(scriptures ? { scriptures: scriptures as unknown as Prisma.InputJsonValue } : {}),
      },
      select: { id: true, durationSeconds: true },
    });
  }

  /** Replaces a lesson's quiz. Each item needs 2 to 6 options and a correct one. */
  async setQuiz(actor: AuthUser, lessonId: string, items: { prompt: string; options: string[]; correctIndex: number }[]) {
    this.assertStaff(actor);
    await this.lessonOrThrow(lessonId);
    const clean = items.map((item, i) => {
      const options = item.options.map((o) => o.trim()).filter(Boolean);
      if (!item.prompt.trim()) throw new BadRequestException(`Question ${i + 1} has no wording.`);
      if (options.length < 2) throw new BadRequestException(`Question ${i + 1} needs at least two options.`);
      if (item.correctIndex < 0 || item.correctIndex >= options.length) throw new BadRequestException(`Question ${i + 1} has no correct option.`);
      return { prompt: item.prompt.trim(), options, correctIndex: item.correctIndex };
    });
    await this.prisma.$transaction([
      this.prisma.lessonQuizItem.deleteMany({ where: { lessonId } }),
      this.prisma.lessonQuizItem.createMany({
        data: clean.map((item, i) => ({ id: randomUUID(), tenantId: this.tenantId, lessonId, sortOrder: i, ...item })),
      }),
    ]);
    return { lessonId, items: clean.length };
  }

  // ── Cohorts ──────────────────────────────────────────────────────────────

  async cohorts(actor: AuthUser, courseId: string) {
    this.assertStaff(actor);
    return this.prisma.classCohort.findMany({
      where: { courseId, tenantId: this.tenantId },
      orderBy: { startsOn: 'desc' },
      select: {
        id: true,
        name: true,
        startsOn: true,
        status: true,
        minSessions: true,
        Sessions: { orderBy: { startsAt: 'asc' }, select: { id: true, title: true, weekNumber: true, startsAt: true, location: true } },
        Facilitators: { select: { Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } } },
        _count: { select: { Enrollments: true } },
      },
    });
  }

  async createCohort(actor: AuthUser, courseId: string, input: { name: string; startsOn: string; minSessions?: number }) {
    this.assertStaff(actor);
    const course = await this.prisma.course.findFirst({ where: { id: courseId, tenantId: this.tenantId, isClass: true }, select: { id: true } });
    if (!course) throw new NotFoundException('Class not found');
    const cohort = await this.prisma.classCohort.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        courseId,
        name: input.name.trim(),
        startsOn: new Date(`${input.startsOn.slice(0, 10)}T00:00:00Z`),
        minSessions: Math.max(0, input.minSessions ?? 0),
      },
      select: { id: true },
    });
    // Learners who registered with nowhere to go are placed as soon as a cohort exists.
    await this.prisma.courseEnrollment.updateMany({
      where: { courseId, cohortId: null, status: { in: [EnrollmentStatus.WAITING, EnrollmentStatus.ACTIVE] } },
      data: { cohortId: cohort.id },
    });
    return cohort;
  }

  async updateCohort(actor: AuthUser, cohortId: string, input: { name?: string; startsOn?: string; status?: 'OPEN' | 'CLOSED'; minSessions?: number }) {
    this.assertStaff(actor);
    await this.assertCohortAccess(actor, cohortId);
    return this.prisma.classCohort.update({
      where: { id: cohortId },
      data: {
        ...(input.name?.trim() ? { name: input.name.trim() } : {}),
        ...(input.startsOn ? { startsOn: new Date(`${input.startsOn.slice(0, 10)}T00:00:00Z`) } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.minSessions !== undefined ? { minSessions: Math.max(0, input.minSessions) } : {}),
      },
      select: { id: true },
    });
  }

  async addSession(actor: AuthUser, cohortId: string, input: { title: string; weekNumber?: number; startsAt: string; location?: string }) {
    this.assertStaff(actor);
    await this.assertCohortAccess(actor, cohortId);
    const startsAt = new Date(input.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new BadRequestException('Give the session a date and time.');
    return this.prisma.cohortSession.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        cohortId,
        title: input.title.trim(),
        weekNumber: input.weekNumber ?? null,
        startsAt,
        location: input.location?.trim() || null,
      },
      select: { id: true },
    });
  }

  async removeSession(actor: AuthUser, sessionId: string) {
    this.assertStaff(actor);
    const { count } = await this.prisma.cohortSession.deleteMany({ where: { id: sessionId, tenantId: this.tenantId } });
    if (!count) throw new NotFoundException('Session not found');
    return { id: sessionId, deleted: true };
  }

  async addFacilitator(actor: AuthUser, cohortId: string, memberId: string) {
    this.assertStaff(actor);
    await this.assertCohortAccess(actor, cohortId);
    const member = await this.prisma.member.findFirst({ where: { id: memberId, tenantId: this.tenantId }, select: { id: true, profileId: true } });
    if (!member) throw new NotFoundException('Member not found');
    await this.prisma.cohortFacilitator.upsert({
      where: { cohortId_memberId: { cohortId, memberId } },
      create: { id: randomUUID(), tenantId: this.tenantId, cohortId, memberId },
      update: {},
    });
    return { cohortId, memberId };
  }

  async removeFacilitator(actor: AuthUser, cohortId: string, memberId: string) {
    this.assertStaff(actor);
    await this.prisma.cohortFacilitator.deleteMany({ where: { cohortId, memberId } });
    return { cohortId, memberId, removed: true };
  }

  /** The cohorts this member facilitates. */
  async facilitating(actor: AuthUser) {
    if (!actor.memberId) return [];
    const rows = await this.prisma.cohortFacilitator.findMany({
      where: { memberId: actor.memberId, tenantId: this.tenantId },
      select: { Cohort: { select: { id: true, name: true, startsOn: true, status: true, Course: { select: { title: true, slug: true } }, _count: { select: { Enrollments: true } } } } },
    });
    return rows.map((r) => r.Cohort);
  }

  // ── Roster, sessions, action steps ───────────────────────────────────────

  async roster(actor: AuthUser, cohortId: string) {
    await this.assertCohortAccess(actor, cohortId);
    const cohort = await this.prisma.classCohort.findUnique({
      where: { id: cohortId },
      select: {
        id: true,
        name: true,
        startsOn: true,
        status: true,
        minSessions: true,
        Course: {
          select: {
            id: true,
            title: true,
            slug: true,
            Modules: { orderBy: { sortOrder: 'asc' }, select: { Lessons: { orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, actionStep: true, actionVerification: true } } } },
          },
        },
        Sessions: { orderBy: { startsAt: 'asc' }, select: { id: true, title: true, weekNumber: true, startsAt: true, location: true, Attendance: { select: { memberId: true } } } },
        Enrollments: {
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            completedAt: true,
            lastActivityAt: true,
            Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true, phone: true, email: true, membershipStatus: true } },
            Progress: { where: { completedAt: { not: null } }, select: { lessonId: true } },
            Actions: { select: { id: true, lessonId: true, doneAt: true, note: true, verifiedAt: true } },
          },
        },
      },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');
    const lessons = cohort.Course.Modules.flatMap((m) => m.Lessons);
    const now = new Date();
    return {
      id: cohort.id,
      name: cohort.name,
      startsOn: cohort.startsOn,
      status: cohort.status,
      minSessions: cohort.minSessions,
      course: { id: cohort.Course.id, title: cohort.Course.title, slug: cohort.Course.slug },
      sessions: cohort.Sessions.map(({ Attendance, ...s }) => ({ ...s, attendees: Attendance.map((a) => a.memberId) })),
      learners: cohort.Enrollments.map((e) => ({
        enrollmentId: e.id,
        member: { ...e.Member, name: memberName(e.Member) },
        status: e.status,
        completedLessons: e.Progress.length,
        totalLessons: lessons.length,
        progressPct: lessons.length ? Math.round((e.Progress.length / lessons.length) * 100) : 0,
        lastActivityAt: e.lastActivityAt,
        stalled: e.status === EnrollmentStatus.ACTIVE && cohort.startsOn <= now && isStalled(e.lastActivityAt, cohort.startsOn, now),
        actions: e.Actions.map((a) => ({
          ...a,
          lessonTitle: lessons.find((l) => l.id === a.lessonId)?.title ?? '',
          needsLeader: lessons.find((l) => l.id === a.lessonId)?.actionVerification === ActionVerification.LEADER,
        })),
      })),
    };
  }

  async markSession(actor: AuthUser, sessionId: string, memberId: string, present: boolean) {
    const session = await this.prisma.cohortSession.findFirst({ where: { id: sessionId, tenantId: this.tenantId }, select: { id: true, cohortId: true } });
    if (!session) throw new NotFoundException('Session not found');
    await this.assertCohortAccess(actor, session.cohortId);
    if (present) {
      await this.prisma.sessionAttendance.upsert({
        where: { sessionId_memberId: { sessionId, memberId } },
        create: { id: randomUUID(), tenantId: this.tenantId, sessionId, memberId, markedById: actor.profileId },
        update: {},
      });
      const enrollment = await this.prisma.courseEnrollment.findFirst({ where: { memberId, cohortId: session.cohortId }, select: { id: true } });
      if (enrollment) await this.learner.recheckEnrollment(enrollment.id);
    } else {
      await this.prisma.sessionAttendance.deleteMany({ where: { sessionId, memberId } });
    }
    return { sessionId, memberId, present };
  }

  async verifyAction(actor: AuthUser, actionId: string, verified: boolean) {
    const action = await this.prisma.actionCompletion.findFirst({
      where: { id: actionId, tenantId: this.tenantId },
      select: { id: true, Enrollment: { select: { cohortId: true } } },
    });
    if (!action) throw new NotFoundException('That action step is gone');
    if (!isStaff(actor)) {
      if (!action.Enrollment.cohortId) throw new ForbiddenException('Only pastors and admins can verify this');
      await this.assertCohortAccess(actor, action.Enrollment.cohortId);
    }
    await this.prisma.actionCompletion.update({
      where: { id: actionId },
      data: verified ? { verifiedAt: new Date(), verifiedById: actor.profileId } : { verifiedAt: null, verifiedById: null },
    });
    return { id: actionId, verified };
  }

  /** Enrolls someone directly, past the eligibility rule: the exception path, with its reason kept. */
  async enrollByException(actor: AuthUser, input: { memberId: string; courseId: string; cohortId?: string; reason: string }) {
    this.assertStaff(actor);
    if (input.reason.trim().length < 5) throw new BadRequestException('Give a reason of at least a few words; it is kept on record.');
    const [course, member] = await Promise.all([
      this.prisma.course.findFirst({ where: { id: input.courseId, tenantId: this.tenantId, isClass: true }, select: { id: true, title: true } }),
      this.prisma.member.findFirst({ where: { id: input.memberId, tenantId: this.tenantId }, select: { id: true } }),
    ]);
    if (!course || !member) throw new NotFoundException('Class or member not found');
    const enrollment = await this.prisma.courseEnrollment.upsert({
      where: { courseId_memberId: { courseId: course.id, memberId: member.id } },
      create: {
        id: randomUUID(),
        tenantId: this.tenantId,
        courseId: course.id,
        memberId: member.id,
        cohortId: input.cohortId ?? null,
        status: EnrollmentStatus.ACTIVE,
        lastActivityAt: new Date(),
        decidedAt: new Date(),
        decidedById: actor.profileId,
        decisionNote: `Added by exception: ${input.reason.trim()}`,
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
        decidedAt: new Date(),
        decidedById: actor.profileId,
        decisionNote: `Added by exception: ${input.reason.trim()}`,
        ...(input.cohortId ? { cohortId: input.cohortId } : {}),
      },
      select: { id: true },
    });
    await this.prisma.membershipEvent.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        memberId: member.id,
        fromStatus: null,
        toStatus: 'ENROLLED',
        method: 'EXCEPTION',
        reason: `Enrolled in ${course.title} by exception: ${input.reason.trim()}`,
        actorProfileId: actor.profileId,
      },
    });
    return enrollment;
  }

  // ── Stalled learners ─────────────────────────────────────────────────────

  async stalled(actor: AuthUser) {
    this.assertStaff(actor);
    return this.findStalled();
  }

  private async findStalled() {
    const now = new Date();
    const rows = await this.prisma.courseEnrollment.findMany({
      where: { tenantId: this.tenantId, status: EnrollmentStatus.ACTIVE, Course: { isClass: true }, Cohort: { startsOn: { lte: now } } },
      select: {
        id: true,
        lastActivityAt: true,
        stalledNotifiedAt: true,
        Course: { select: { title: true, slug: true } },
        Cohort: { select: { id: true, name: true, startsOn: true, Facilitators: { select: { Member: { select: { profileId: true } } } } } },
        Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true, phone: true } },
      },
    });
    return rows
      .filter((r) => r.Cohort && isStalled(r.lastActivityAt, r.Cohort.startsOn, now))
      .map((r) => ({
        enrollmentId: r.id,
        member: { ...r.Member, name: memberName(r.Member) },
        class: r.Course,
        cohort: { id: r.Cohort!.id, name: r.Cohort!.name },
        lastActivityAt: r.lastActivityAt,
        notifiedAt: r.stalledNotifiedAt,
        facilitatorProfileIds: r.Cohort!.Facilitators.map((f) => f.Member.profileId),
      }));
  }

  /** Daily: tells each stalled learner's facilitators, once per stall. Access is never removed. */
  @Cron('0 10 * * *', { name: 'class-stalled-learners' })
  async notifyStalled() {
    const stalled = (await this.findStalled()).filter((s) => !s.notifiedAt);
    for (const s of stalled) {
      if (s.facilitatorProfileIds.length) {
        await this.inbox
          .createMany(
            s.facilitatorProfileIds.map((profileId) => ({
              tenantId: this.tenantId,
              profileId,
              type: 'class-stalled',
              title: `${s.member.name} has not moved in ${s.class.title} for three weeks`,
              body: `Cohort ${s.cohort.name}. A call or message may help them pick it up again.`,
              link: `/dashboard/classes/facilitate/${s.cohort.id}`,
            })),
          )
          .catch((err: Error) => this.logger.warn(`Stalled notification failed: ${err.message}`));
      }
      await this.prisma.courseEnrollment.update({ where: { id: s.enrollmentId }, data: { stalledNotifiedAt: new Date() } });
    }
    return { flagged: stalled.length };
  }
}
