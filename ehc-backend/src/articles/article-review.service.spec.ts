import { ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ArticleReviewService } from './article-review.service';
import type { AuthUser } from '../auth/types/auth-user';

/**
 * Who reviews member articles, and what happens when they do.
 *
 * The reviewer is whoever heads the department that owns the Content Writing
 * Team — resolved from the unit, so it follows the church's structure rather
 * than a hardcoded person. Pastors and admins can always review, so a piece
 * never waits forever on an empty seat.
 */
const CONTENT_DEPT = 'dept-content';

const actor = (profileId: string, roles: Role[], hodOf: string[] = []) =>
  ({
    profileId,
    tenantId: 'tenant-1',
    effectiveRoles: [Role.MEMBER, ...roles],
    hodOf,
  }) as unknown as AuthUser;

const CONTENT_HOD = actor('hod-content', [Role.HOD], [CONTENT_DEPT]);
const OTHER_HOD = actor('hod-ops', [Role.HOD], ['dept-ops']);
const PASTOR = actor('pastor-1', [Role.PASTOR]);
const MEMBER = actor('member-1', []);

const PENDING = {
  id: 'a-1',
  slug: 'a-word',
  title: 'A word for today',
  status: 'PENDING_REVIEW',
  authorId: 'author-1',
  publishedAt: null as Date | null,
  revision: 1,
};

function makeService({
  contentUnit = true,
  article = PENDING as typeof PENDING | null,
  updated = 1,
  heads = [{ userId: 'hod-content' }],
  hods = [] as { userId: string }[],
  grants = [{ userId: 'pastor-1' }],
  inboxFails = false,
} = {}) {
  const prisma = {
    unit: {
      findFirst: jest.fn(async () =>
        contentUnit ? { departmentId: CONTENT_DEPT } : null,
      ),
    },
    memberArticle: {
      count: jest.fn(async () => 3),
      findMany: jest.fn(async () => []),
      findFirst: jest.fn(async () => article),
      updateMany: jest.fn(async () => ({ count: updated })),
    },
    departmentHead: { findMany: jest.fn(async () => heads) },
    departmentHod: { findMany: jest.fn(async () => hods) },
    roleGrant: { findMany: jest.fn(async () => grants) },
  };
  const inbox = {
    createMany: jest.fn(async (items: unknown[]) => {
      if (inboxFails) throw new Error('inbox down');
      return items.length;
    }),
  };
  const service = new ArticleReviewService(
    prisma as never,
    inbox as never,
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );
  return { service, prisma, inbox };
}

beforeEach(() => {
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('who can review', () => {
  it('rejects a reviewer from another tenant or without a profile', async () => {
    const { service } = makeService();
    expect(await service.canReview({ ...PASTOR, tenantId: 'other' })).toBe(
      false,
    );
    expect(await service.canReview({ ...PASTOR, profileId: null })).toBe(false);
  });

  it('does not give a Content Writing unit lead HOD authority', async () => {
    const { service } = makeService();
    expect(
      await service.canReview({
        ...MEMBER,
        effectiveRoles: [Role.MEMBER, Role.UNIT_LEAD],
        unitLeadOf: ['content-unit'],
      }),
    ).toBe(false);
  });
  it('admits the head of the department that owns the Content Writing Team', async () => {
    const { service } = makeService();
    expect(await service.canReview(CONTENT_HOD)).toBe(true);
  });

  it('does not admit the head of any other department', async () => {
    const { service } = makeService();
    expect(await service.canReview(OTHER_HOD)).toBe(false);
  });

  it('admits a pastor without needing the unit at all', async () => {
    const { service, prisma } = makeService({ contentUnit: false });
    expect(await service.canReview(PASTOR)).toBe(true);
    expect(prisma.unit.findFirst).not.toHaveBeenCalled();
  });

  it('refuses an ordinary member', async () => {
    const { service } = makeService();
    expect(await service.canReview(MEMBER)).toBe(false);
  });

  it('falls back to pastors and admins only when the unit is missing', async () => {
    const { service } = makeService({ contentUnit: false });
    expect(await service.canReview(CONTENT_HOD)).toBe(false);
  });

  it('reports the waiting count to a reviewer and nothing to anyone else', async () => {
    const { service, prisma } = makeService();

    expect(await service.access(CONTENT_HOD)).toEqual({
      canReview: true,
      pending: 3,
    });
    prisma.memberArticle.count.mockClear();
    expect(await service.access(MEMBER)).toEqual({
      canReview: false,
      pending: 0,
    });
    expect(prisma.memberArticle.count).not.toHaveBeenCalled();
  });
});

describe('approving', () => {
  it('requires a different reviewer for a reviewer’s own article', async () => {
    const { service, prisma } = makeService({
      article: { ...PENDING, authorId: CONTENT_HOD.profileId! },
    });
    await expect(service.approve(CONTENT_HOD, 'a-1', 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.memberArticle.updateMany).not.toHaveBeenCalled();
  });

  it('cannot approve a newer revision than the reviewer read', async () => {
    const { service, prisma } = makeService({
      article: { ...PENDING, revision: 2 },
    });
    await expect(service.approve(CONTENT_HOD, 'a-1', 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.memberArticle.updateMany).not.toHaveBeenCalled();
  });
  it('publishes the piece, records the reviewer and tells the author', async () => {
    const { service, prisma, inbox } = makeService();

    await service.approve(CONTENT_HOD, 'a-1', 1, 'Beautifully put.');

    const { where, data } = (prisma.memberArticle.updateMany as jest.Mock).mock
      .calls[0][0];
    // Conditional on still waiting, so two reviewers cannot both approve.
    expect(where.status).toBe('PENDING_REVIEW');
    expect(data.status).toBe('PUBLISHED');
    expect(data.publishedAt).toBeInstanceOf(Date);
    expect(data.reviewedById).toBe('hod-content');
    expect(data.reviewNote).toBe('Beautifully put.');

    const [note] = (inbox.createMany as jest.Mock).mock.calls[0][0];
    expect(note.profileId).toBe('author-1');
    expect(note.link).toBe('/dashboard/articles/a-word');
  });

  it('keeps the date the church first read a piece that returns', async () => {
    const firstRead = new Date('2026-08-01');
    const { service, prisma } = makeService({
      article: { ...PENDING, publishedAt: firstRead },
    });

    await service.approve(PASTOR, 'a-1', 1);

    expect(
      (prisma.memberArticle.updateMany as jest.Mock).mock.calls[0][0].data
        .publishedAt,
    ).toBe(firstRead);
  });

  it('reports a conflict when another reviewer got there first', async () => {
    const { service, inbox } = makeService({ updated: 0 });
    await expect(service.approve(CONTENT_HOD, 'a-1', 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(inbox.createMany).not.toHaveBeenCalled();
  });

  it('refuses a piece that is not waiting for review', async () => {
    const { service } = makeService({
      article: { ...PENDING, status: 'DRAFT' },
    });
    await expect(service.approve(CONTENT_HOD, 'a-1', 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('refuses a non-reviewer before touching the article', async () => {
    const { service, prisma } = makeService();
    await expect(service.approve(OTHER_HOD, 'a-1', 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.memberArticle.findFirst).not.toHaveBeenCalled();
  });
});

describe('sending back', () => {
  it('requires useful feedback, not whitespace', async () => {
    const { service, prisma } = makeService();
    await expect(
      service.requestChanges(CONTENT_HOD, 'a-1', 1, '    '),
    ).rejects.toThrow(/Explain the changes/);
    expect(prisma.memberArticle.updateMany).not.toHaveBeenCalled();
  });
  it('returns the piece to a draft with the note, and links the author to the editor', async () => {
    const { service, prisma, inbox } = makeService();

    await service.requestChanges(
      CONTENT_HOD,
      'a-1',
      1,
      'Could you say more about verse 28?',
    );

    const { data } = (prisma.memberArticle.updateMany as jest.Mock).mock
      .calls[0][0];
    expect(data.status).toBe('DRAFT');
    expect(data.reviewNote).toBe('Could you say more about verse 28?');

    const [note] = (inbox.createMany as jest.Mock).mock.calls[0][0];
    expect(note.link).toBe('/dashboard/articles/write?slug=a-word');
  });
});

describe('telling reviewers a piece is waiting', () => {
  it('notifies another reviewer when the only HOD is the author', async () => {
    const { service, inbox } = makeService({
      heads: [{ userId: 'author-1' }],
      hods: [],
    });
    await service.notifyReviewers({ title: 'A word', authorId: 'author-1' });
    expect(inbox.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ profileId: 'pastor-1' }),
      ]),
    );
  });

  it('does not report submission failure when reviewer lookup fails', async () => {
    const { service, prisma } = makeService();
    prisma.unit.findFirst.mockRejectedValueOnce(new Error('database timeout'));
    await expect(
      service.notifyReviewers({ title: 'A word', authorId: 'author-1' }),
    ).resolves.toBe(0);
  });
  it('notifies the content department heads, never the author', async () => {
    const { service, inbox } = makeService({
      heads: [{ userId: 'hod-content' }],
      hods: [{ userId: 'author-1' }, { userId: 'hod-content' }],
    });

    const sent = await service.notifyReviewers({
      title: 'A word',
      authorId: 'author-1',
    });

    const recipients = (inbox.createMany as jest.Mock).mock.calls[0][0].map(
      (n: { profileId: string }) => n.profileId,
    );
    expect(recipients).toEqual(['hod-content']);
    expect(sent).toBe(1);
  });

  it('falls back to pastors and super admins when the department has no head', async () => {
    const { service, inbox } = makeService({ heads: [], hods: [] });
    await service.notifyReviewers({ title: 'A word', authorId: 'author-1' });

    expect((inbox.createMany as jest.Mock).mock.calls[0][0][0].profileId).toBe(
      'pastor-1',
    );
  });

  it('does not fail the submission when the inbox is down', async () => {
    const { service } = makeService({ inboxFails: true });
    await expect(
      service.notifyReviewers({ title: 'A word', authorId: 'author-1' }),
    ).resolves.toBe(0);
  });
});
