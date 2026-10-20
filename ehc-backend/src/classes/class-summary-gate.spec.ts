import 'reflect-metadata';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { ClassesController } from './classes.controller';
import { ClassesLearnerService } from './classes-learner.service';
import { lessonComplete } from './class-rules';

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

const VOCAB = (
  'grace faith family belong house prayer word spirit church love honour walk light shepherd hope mercy truth ' +
  'community fellowship scripture service people table welcome promise strength patience kindness gentle ' +
  'humble teach learn follow trust obey serve give share gather worship praise thanks rest peace joy'
).split(' ');
const GOOD = Array.from({ length: 60 }, (_, i) => VOCAB[i % VOCAB.length]).join(' ');

function setup(videoDoneAt: Date | null, videoUrl: string | null = 'https://youtu.be/abcdefghijk') {
  const prisma = { lessonProgress: { findUnique: jest.fn().mockResolvedValue(videoDoneAt ? { videoDoneAt } : { videoDoneAt: null }) } };
  const svc = new ClassesLearnerService(prisma as never, {} as never, {} as never, { get: () => 't1' } as never);
  const touch = jest.spyOn(svc, 'touch').mockResolvedValue(false);
  jest.spyOn(svc, 'openLesson').mockResolvedValue({ enrollment: { id: 'e1' }, entry: { lesson: { id: 'l1', videoUrl } } } as never);
  return { svc, touch };
}

describe('saving a summary', () => {
  it('returns 409 until the server has seen the video watched', async () => {
    const { svc, touch } = setup(null);
    await expect(svc.saveSummary(actor, 'membership', 'welcome', GOOD)).rejects.toBeInstanceOf(ConflictException);
    expect(touch).not.toHaveBeenCalled();
  });

  it('accepts a good summary once the video is watched', async () => {
    const { svc, touch } = setup(new Date());
    await expect(svc.saveSummary(actor, 'membership', 'welcome', GOOD)).resolves.toMatchObject({ saved: true });
    expect(touch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ reflection: GOOD }), expect.anything());
  });

  it('rejects a short summary and filler, and never repeats what was written in the error', async () => {
    const { svc, touch } = setup(new Date());
    const secret = 'my private prayer about my marriage';
    for (const text of [secret, 'lesson '.repeat(80)]) {
      const err = await svc.saveSummary(actor, 'membership', 'welcome', text).catch((e: Error) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as Error).message).not.toContain('marriage');
      expect(JSON.stringify((err as BadRequestException).getResponse())).not.toContain('marriage');
    }
    expect(touch).not.toHaveBeenCalled();
  });

  it('asks for a summary with no video as well, since every lesson has one', async () => {
    const { svc } = setup(null, null);
    await expect(svc.saveSummary(actor, 'membership', 'welcome', GOOD)).resolves.toMatchObject({ saved: true });
  });
});

describe('the next lesson', () => {
  const req = { hasVideo: true, quizCount: 0, hasReflection: true, hasAction: false };
  it('stays locked until the video is watched and a summary is accepted', () => {
    expect(lessonComplete(req, { videoDone: true, quizPassed: false, reflected: false, actionDone: false })).toBe(false);
    expect(lessonComplete(req, { videoDone: false, quizPassed: false, reflected: true, actionDone: false })).toBe(false);
    expect(lessonComplete(req, { videoDone: true, quizPassed: false, reflected: true, actionDone: false })).toBe(true);
  });
});

describe('what a browser can ask the server to do', () => {
  it('has no endpoint that marks a lesson watched', () => {
    const proto = ClassesController.prototype as unknown as Record<string, unknown>;
    const routes = Object.getOwnPropertyNames(ClassesController.prototype)
      .filter((name) => name !== 'constructor')
      .map((name) => `${Reflect.getMetadata('method', proto[name] as object)} ${Reflect.getMetadata('path', proto[name] as object)}`);
    expect(routes.some((r) => /lessons\/:lesson\/video/.test(r))).toBe(false);
    expect(routes.some((r) => /lessons\/:lesson\/reflection/.test(r))).toBe(false);
    expect(routes).toEqual(expect.arrayContaining([expect.stringContaining('lessons/:lesson/watch-sessions'), expect.stringContaining('lessons/:lesson/summary')]));
  });
});
