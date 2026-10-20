import { ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrollmentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { ClassesLearnerService } from './classes-learner.service';
import { applyHeartbeat, watchComplete } from './watch-rules';

/** How many sittings one learner may open on one lesson in an hour. Real watching needs a handful. */
const MAX_SESSIONS_PER_HOUR = 20;

/**
 * Server-verified watching. The browser starts a sitting and sends a heartbeat
 * with the player's position; this service decides what that is worth (see
 * watch-rules) and is the only place a lesson video is ever marked watched.
 *
 * Nothing here logs or stores anything a learner wrote. Positions are numbers.
 */
@Injectable()
export class ClassWatchService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly learner: ClassesLearnerService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Opens a sitting. Also tells the player where to resume and whether the video has already been watched. */
  async start(actor: AuthUser, slug: string, lessonRef: string, position?: number) {
    const ctx = await this.learner.openLesson(actor, slug, lessonRef);
    const lesson = ctx.entry.lesson;
    if (!lesson.videoUrl?.trim()) throw new ConflictException('This lesson has no video to watch.');
    if (!lesson.durationSeconds || lesson.durationSeconds <= 0) {
      throw new ConflictException('The video for this lesson is not ready yet. Please check back soon.');
    }
    const progress = await this.prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: ctx.enrollment.id, lessonId: lesson.id } },
      create: { id: randomUUID(), tenantId: this.tenantId, enrollmentId: ctx.enrollment.id, lessonId: lesson.id },
      update: {},
      select: { videoDoneAt: true, watchMaxPosition: true, watchSeconds: true },
    });
    const state = {
      durationSeconds: lesson.durationSeconds,
      maxPosition: progress.watchMaxPosition,
      watchedSeconds: progress.watchSeconds,
      watched: !!progress.videoDoneAt,
    };
    if (progress.videoDoneAt) return { sessionId: null, ...state };

    const recent = await this.prisma.lessonWatchSession.count({
      where: { enrollmentId: ctx.enrollment.id, lessonId: lesson.id, startedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= MAX_SESSIONS_PER_HOUR) {
      throw new HttpException('Too many attempts. Please wait a little and try again.', HttpStatus.TOO_MANY_REQUESTS);
    }
    const start = Math.max(0, Math.min(Math.floor(position ?? 0), progress.watchMaxPosition));
    const session = await this.prisma.lessonWatchSession.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        enrollmentId: ctx.enrollment.id,
        lessonId: lesson.id,
        lastPosition: start,
        maxPosition: start,
      },
      select: { id: true },
    });
    return { sessionId: session.id, ...state };
  }

  /**
   * One heartbeat. Kept light on purpose (two small reads and two small writes,
   * no class outline) because every watching learner sends one every 15 seconds.
   * `maxWatched` from the browser is advisory and is not used to credit anything.
   */
  async heartbeat(actor: AuthUser, slug: string, lessonRef: string, sessionId: string, position: number) {
    if (!actor.memberId) throw new ForbiddenException('Your account has no member record yet. Contact the church office.');
    const session = await this.prisma.lessonWatchSession.findFirst({
      where: { id: sessionId, tenantId: this.tenantId, Enrollment: { memberId: actor.memberId } },
      select: {
        id: true,
        enrollmentId: true,
        startedAt: true,
        lastHeartbeatAt: true,
        lastPosition: true,
        maxPosition: true,
        accumulatedSeconds: true,
        Enrollment: { select: { status: true, Course: { select: { slug: true } } } },
        Lesson: { select: { id: true, slug: true, durationSeconds: true } },
      },
    });
    if (!session) throw new NotFoundException('That viewing session is gone. Press play to start again.');
    const { Lesson: lesson, Enrollment: enrollment } = session;
    if (enrollment.Course.slug !== slug || (lesson.id !== lessonRef && lesson.slug !== lessonRef)) {
      throw new NotFoundException('That viewing session is not for this lesson.');
    }
    if (enrollment.status !== EnrollmentStatus.ACTIVE && enrollment.status !== EnrollmentStatus.COMPLETED) {
      throw new ForbiddenException('This class is not open to you.');
    }
    if (!lesson.durationSeconds) throw new ConflictException('The video for this lesson is not ready yet.');

    const progress = await this.prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: session.enrollmentId, lessonId: lesson.id } },
      select: { id: true, videoDoneAt: true, watchMaxPosition: true, watchSeconds: true, watchLastHeartbeatAt: true },
    });
    if (!progress) throw new NotFoundException('That viewing session is gone. Press play to start again.');
    const current = { watched: !!progress.videoDoneAt, maxPosition: progress.watchMaxPosition, watchedSeconds: progress.watchSeconds, completed: false };
    if (progress.videoDoneAt) return current;

    const now = new Date();
    const result = applyHeartbeat(
      session,
      { maxPosition: progress.watchMaxPosition, seconds: progress.watchSeconds, lastHeartbeatAt: progress.watchLastHeartbeatAt },
      position,
      now,
      lesson.durationSeconds,
    );
    if (!result.accepted) return current;

    // Compare-and-set on the last heartbeat time: if another heartbeat for this lesson got in first, this one is dropped.
    const saved = await this.prisma.lessonProgress.updateMany({
      where: { id: progress.id, videoDoneAt: null, watchLastHeartbeatAt: progress.watchLastHeartbeatAt },
      data: { watchMaxPosition: result.lesson.maxPosition, watchSeconds: result.lesson.seconds, watchLastHeartbeatAt: now },
    });
    if (saved.count === 0) return current;
    await this.prisma.lessonWatchSession.update({
      where: { id: session.id },
      data: {
        lastHeartbeatAt: now,
        lastPosition: result.session.lastPosition,
        maxPosition: result.session.maxPosition,
        accumulatedSeconds: result.session.accumulatedSeconds,
      },
    });

    const watched = watchComplete(lesson.durationSeconds, result.lesson.maxPosition, result.lesson.seconds);
    let completed = false;
    if (watched) {
      // The only place a lesson video is marked watched. `touch` also works out whether the lesson is now complete.
      const ctx = await this.learner.openLesson(actor, slug, lesson.id);
      completed = await this.learner.touch(ctx, { videoDoneAt: now }, { videoDoneAt: now });
    }
    return { watched, maxPosition: result.lesson.maxPosition, watchedSeconds: result.lesson.seconds, completed };
  }
}
