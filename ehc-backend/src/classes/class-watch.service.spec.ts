import { ConflictException, ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { ClassWatchService } from './class-watch.service';

const actor: AuthUser = {
  userId: 'u1',
  email: 'm@x.com',
  role: Role.MEMBER,
  effectiveRoles: [Role.MEMBER],
  unitLeadOf: [],
  hodOf: [],
  headUsher: false,
  profileId: 'p1',
  memberId: 'm1',
  tenantId: 't1',
};

const DURATION = 600;

function setup(over: { session?: object | null; progress?: object | null; casCount?: number; lesson?: object } = {}) {
  const startedAt = new Date(Date.now() - 20_000);
  const session =
    over.session === null
      ? null
      : {
          id: 's1',
          enrollmentId: 'e1',
          startedAt,
          lastHeartbeatAt: startedAt,
          lastPosition: 0,
          maxPosition: 0,
          accumulatedSeconds: 0,
          Enrollment: { status: 'ACTIVE', Course: { slug: 'membership' } },
          Lesson: { id: 'l1', slug: 'welcome', durationSeconds: DURATION },
          ...over.session,
        };
  const progress =
    over.progress === null
      ? null
      : { id: 'p1', videoDoneAt: null, watchMaxPosition: 0, watchSeconds: 0, watchLastHeartbeatAt: null, ...over.progress };
  const prisma = {
    lessonWatchSession: {
      findFirst: jest.fn().mockResolvedValue(session),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({ id: 'new-session' }),
      count: jest.fn().mockResolvedValue(0),
    },
    lessonProgress: {
      findUnique: jest.fn().mockResolvedValue(progress),
      updateMany: jest.fn().mockResolvedValue({ count: over.casCount ?? 1 }),
      upsert: jest.fn().mockResolvedValue({ videoDoneAt: null, watchMaxPosition: 0, watchSeconds: 0, ...over.progress }),
    },
  };
  const lessonEntry = { id: 'l1', videoUrl: 'https://youtu.be/abcdefghijk', durationSeconds: DURATION, ...over.lesson };
  const learner = {
    openLesson: jest.fn().mockResolvedValue({ enrollment: { id: 'e1' }, entry: { lesson: lessonEntry } }),
    touch: jest.fn().mockResolvedValue(true),
  };
  const svc = new ClassWatchService(prisma as never, learner as never, { get: () => 't1' } as never);
  return { svc, prisma, learner };
}

describe('ClassWatchService.start', () => {
  it('refuses a lesson with no video, and one whose length is not known yet', async () => {
    await expect(setup({ lesson: { videoUrl: null } }).svc.start(actor, 'membership', 'welcome')).rejects.toBeInstanceOf(ConflictException);
    await expect(setup({ lesson: { durationSeconds: null } }).svc.start(actor, 'membership', 'welcome')).rejects.toBeInstanceOf(ConflictException);
  });

  it('opens a sitting that can resume no further than the server has seen', async () => {
    const { svc, prisma } = setup({ progress: { watchMaxPosition: 120, watchSeconds: 120 } });
    const r = await svc.start(actor, 'membership', 'welcome', 9999);
    expect(r).toMatchObject({ sessionId: 'new-session', durationSeconds: DURATION, maxPosition: 120, watched: false });
    expect(prisma.lessonWatchSession.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ lastPosition: 120 }) }));
  });

  it('needs no sitting once the video has been watched', async () => {
    const { svc, prisma } = setup({ progress: { videoDoneAt: new Date() } });
    await expect(svc.start(actor, 'membership', 'welcome')).resolves.toMatchObject({ sessionId: null, watched: true });
    expect(prisma.lessonWatchSession.create).not.toHaveBeenCalled();
  });

  it('limits how many sittings can be opened in an hour', async () => {
    const { svc, prisma } = setup();
    prisma.lessonWatchSession.count.mockResolvedValue(20);
    await expect(svc.start(actor, 'membership', 'welcome')).rejects.toBeInstanceOf(HttpException);
  });
});

describe('ClassWatchService.heartbeat', () => {
  it('credits at most 18 seconds when a client claims 300 in a 15 second gap', async () => {
    const startedAt = new Date(Date.now() - 15_000);
    const { svc, prisma } = setup({ session: { startedAt, lastHeartbeatAt: startedAt } });
    const r = await svc.heartbeat(actor, 'membership', 'welcome', 's1', 300);
    expect(r.watchedSeconds).toBeLessThanOrEqual(18);
    expect(r.watched).toBe(false);
    const saved = prisma.lessonProgress.updateMany.mock.calls[0]?.[0]?.data;
    expect(saved?.watchSeconds ?? 0).toBeLessThanOrEqual(18);
  });

  it('credits honest playing', async () => {
    const startedAt = new Date(Date.now() - 15_000);
    const { svc } = setup({ session: { startedAt, lastHeartbeatAt: startedAt } });
    const r = await svc.heartbeat(actor, 'membership', 'welcome', 's1', 15);
    expect(r).toMatchObject({ watched: false, maxPosition: 15, watchedSeconds: 15 });
  });

  it('is the only thing that marks the video watched, and only when the rules are met', async () => {
    const lastBeat = new Date(Date.now() - 15_000);
    const sittingStart = new Date(Date.now() - 10 * 60 * 1000);
    const { svc, learner } = setup({
      session: { startedAt: sittingStart, lastHeartbeatAt: lastBeat, lastPosition: 584, maxPosition: 584, accumulatedSeconds: 584 },
      progress: { watchMaxPosition: 584, watchSeconds: 584, watchLastHeartbeatAt: lastBeat },
    });
    const r = await svc.heartbeat(actor, 'membership', 'welcome', 's1', 599);
    expect(r.watched).toBe(true);
    expect(learner.touch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ videoDoneAt: expect.any(Date) }), expect.anything());
  });

  it('does not mark watched when the end was reached without the time credited', async () => {
    const startedAt = new Date(Date.now() - 15_000);
    const { svc, learner } = setup({ session: { startedAt, lastHeartbeatAt: startedAt, lastPosition: 590 }, progress: { watchMaxPosition: 590, watchSeconds: 100 } });
    const r = await svc.heartbeat(actor, 'membership', 'welcome', 's1', 600);
    expect(r.watched).toBe(false);
    expect(learner.touch).not.toHaveBeenCalled();
  });

  it('drops a heartbeat that lost a race with another one', async () => {
    const startedAt = new Date(Date.now() - 15_000);
    const { svc, prisma } = setup({ session: { startedAt, lastHeartbeatAt: startedAt }, casCount: 0 });
    const r = await svc.heartbeat(actor, 'membership', 'welcome', 's1', 15);
    expect(r.watchedSeconds).toBe(0);
    expect(prisma.lessonWatchSession.update).not.toHaveBeenCalled();
  });

  it('writes nothing once the video is already watched', async () => {
    const { svc, prisma } = setup({ progress: { videoDoneAt: new Date(), watchSeconds: 600, watchMaxPosition: 600 } });
    await expect(svc.heartbeat(actor, 'membership', 'welcome', 's1', 10)).resolves.toMatchObject({ watched: true });
    expect(prisma.lessonProgress.updateMany).not.toHaveBeenCalled();
  });

  it('refuses a sitting that is not this learner\'s, not for this lesson, or for a class that is not open to them', async () => {
    await expect(setup({ session: null }).svc.heartbeat(actor, 'membership', 'welcome', 's1', 5)).rejects.toBeInstanceOf(NotFoundException);
    await expect(setup().svc.heartbeat(actor, 'membership', 'another-lesson', 's1', 5)).rejects.toBeInstanceOf(NotFoundException);
    await expect(setup().svc.heartbeat(actor, 'believers', 'welcome', 's1', 5)).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      setup({ session: { Enrollment: { status: 'PENDING', Course: { slug: 'membership' } } } }).svc.heartbeat(actor, 'membership', 'welcome', 's1', 5),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(setup().svc.heartbeat({ ...actor, memberId: null }, 'membership', 'welcome', 's1', 5)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
