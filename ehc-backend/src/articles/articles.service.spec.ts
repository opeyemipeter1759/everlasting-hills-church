import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ArticlesService } from './articles.service';
import type { AuthUser } from '../auth/types/auth-user';

/**
 * The rules that decide whether members will actually write here, and what
 * reaches the church.
 *
 * Drafts are private. Asking to publish sends a member's piece for review by
 * the content department's head; a reviewer's own piece goes straight out.
 * Rewriting a live piece sends it back, because what was approved is no longer
 * what the church would read. Review itself is covered in
 * article-review.service.spec.ts.
 */
const AUTHOR = {
  tenantId: 'tenant-1',
  profileId: 'author-1',
  effectiveRoles: [Role.MEMBER],
} as AuthUser;
const READER = {
  tenantId: 'tenant-1',
  profileId: 'reader-1',
  effectiveRoles: [Role.MEMBER],
} as AuthUser;
const PASTOR = {
  tenantId: 'tenant-1',
  profileId: 'pastor-1',
  effectiveRoles: [Role.MEMBER, Role.PASTOR],
} as AuthUser;

function makeService(
  article: Record<string, unknown> | null,
  { reviewer = false } = {},
) {
  const updates: Record<string, unknown>[] = [];
  const likes = new Set<string>();

  const tx = {
    memberArticleLike: {
      createMany: jest.fn(
        async ({ data }: { data: { profileId: string }[] }) => {
          const key = data[0].profileId;
          if (likes.has(key)) return { count: 0 };
          likes.add(key);
          return { count: 1 };
        },
      ),
      deleteMany: jest.fn(
        async ({ where }: { where: { profileId: string } }) => ({
          count: likes.delete(where.profileId) ? 1 : 0,
        }),
      ),
    },
    memberArticle: {
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        return { likeCount: likes.size };
      }),
      findUnique: jest.fn(async () => ({ likeCount: likes.size })),
    },
  };

  const prisma = {
    memberArticle: {
      findFirst: jest.fn(async () => article),
      findMany: jest.fn(async () => []),
      count: jest.fn(async () => 0),
      create: jest.fn(
        async ({ data }: { data: Record<string, unknown> }) => data,
      ),
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        return { id: 'a-1', slug: 'x', status: data.status ?? 'DRAFT' };
      }),
      updateMany: jest.fn(
        async ({ data }: { data: Record<string, unknown> }) => {
          updates.push(data);
          return { count: 1 };
        },
      ),
      delete: jest.fn(async () => ({})),
    },
    $transaction: jest.fn(async (fn: (client: unknown) => Promise<unknown>) =>
      fn(tx),
    ),
  };

  const review = {
    canReview: jest.fn(async () => reviewer),
    notifyReviewers: jest.fn(async () => 1),
  };

  const service = new ArticlesService(
    prisma as never,
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
    review as never,
  );

  return { service, prisma, review, updates, likes };
}

const DRAFT = {
  id: 'a-1',
  tenantId: 'tenant-1',
  authorId: 'author-1',
  slug: 'what-romans-8-showed-me',
  title: 'What Romans 8 showed me',
  body: 'x'.repeat(60),
  status: 'DRAFT',
  publishedAt: null,
  startVerseId: null,
  endVerseId: null,
  Likes: [],
  revision: 1,
};

const PENDING = { ...DRAFT, status: 'PENDING_REVIEW' };
const PUBLISHED = {
  ...DRAFT,
  status: 'PUBLISHED',
  publishedAt: new Date('2026-09-01'),
};

describe('reading an article', () => {
  it('rejects another tenant before reading articles', async () => {
    const { service, prisma } = makeService(PUBLISHED);
    await expect(
      service.bySlug({ ...READER, tenantId: 'other' }, PUBLISHED.slug),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.memberArticle.findFirst).not.toHaveBeenCalled();
  });

  it('keeps private drafts hidden from administrators and reviewers', async () => {
    const { service } = makeService(DRAFT, { reviewer: true });
    await expect(service.bySlug(PASTOR, DRAFT.slug)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('does not expose editorial feedback in the published article', async () => {
    const { service } = makeService({
      ...PUBLISHED,
      reviewNote: 'Private feedback',
      reviewedById: 'hod',
    });
    const article = await service.bySlug(READER, PUBLISHED.slug);
    expect(article.reviewNote).toBeNull();
    expect(article.reviewedById).toBeNull();
  });
  it('shows an author their own draft', async () => {
    const { service } = makeService(DRAFT);
    const article = await service.bySlug(AUTHOR, DRAFT.slug);
    expect(article.isAuthor).toBe(true);
  });

  it("hides somebody else's draft rather than refusing it", async () => {
    // Not found, not forbidden: an unpublished piece should not be discoverable
    // by probing slugs.
    const { service } = makeService(DRAFT);
    await expect(service.bySlug(READER, DRAFT.slug)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lets a reviewer read a piece that is waiting for them', async () => {
    const { service, prisma } = makeService(PENDING, { reviewer: true });
    const article = await service.bySlug(READER, PENDING.slug);

    expect(article.canReview).toBe(true);
    // Reading it to review it is not a view.
    expect(prisma.memberArticle.update).not.toHaveBeenCalled();
  });

  it('hides a waiting piece from a member who is not reviewing it', async () => {
    const { service } = makeService(PENDING);
    await expect(service.bySlug(READER, PENDING.slug)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('counts a view for a reader but not for the author', async () => {
    const forReader = makeService(PUBLISHED);
    await forReader.service.bySlug(READER, PUBLISHED.slug);
    expect(forReader.prisma.memberArticle.update).toHaveBeenCalled();

    const forAuthor = makeService(PUBLISHED);
    await forAuthor.service.bySlug(AUTHOR, PUBLISHED.slug);
    expect(forAuthor.prisma.memberArticle.update).not.toHaveBeenCalled();
  });
});

describe('publishing', () => {
  it('rejects an edit from a stale editor before mutating the article', async () => {
    const { service, prisma } = makeService({ ...DRAFT, revision: 2 });
    await expect(
      service.update(AUTHOR, 'a-1', { body: 'Changed article', revision: 1 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.memberArticle.updateMany).not.toHaveBeenCalled();
  });

  it('does not overwrite an approval that raced with an author edit', async () => {
    const { service, prisma, review } = makeService(PENDING);
    prisma.memberArticle.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      service.update(AUTHOR, 'a-1', { body: 'New unreviewed content' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.memberArticle.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'a-1', tenantId: 'tenant-1', revision: 1 },
      }),
    );
    expect(review.notifyReviewers).not.toHaveBeenCalled();
  });
  it("sends a member's publish to review instead of publishing it", async () => {
    const { service, updates, review } = makeService(DRAFT);
    await service.update(AUTHOR, 'a-1', { status: 'PUBLISHED' });

    expect(updates[0].status).toBe('PENDING_REVIEW');
    expect(updates[0].submittedAt).toBeInstanceOf(Date);
    expect(updates[0].publishedAt).toBeUndefined();
    expect(review.notifyReviewers).toHaveBeenCalledWith({
      title: DRAFT.title,
      authorId: DRAFT.authorId,
    });
  });

  it("requires another reviewer for a reviewer's own piece", async () => {
    const { service, updates, review } = makeService(DRAFT, { reviewer: true });
    await service.update(AUTHOR, 'a-1', { status: 'PUBLISHED' });

    expect(updates[0].status).toBe('PENDING_REVIEW');
    expect(updates[0].publishedAt).toBeUndefined();
    expect(review.notifyReviewers).toHaveBeenCalled();
  });

  it('keeps the original publish date when an archived piece returns', async () => {
    const archived = { ...PUBLISHED, status: 'ARCHIVED' };
    const { service, updates } = makeService(archived, { reviewer: true });

    await service.update(AUTHOR, 'a-1', { status: 'PUBLISHED' });

    // The church first read it in September; re-publishing does not rewrite that.
    expect(updates[0].publishedAt).toBeUndefined();
  });

  it('sends a live piece back to review when its words change', async () => {
    const { service, updates, review } = makeService(PUBLISHED);
    await service.update(AUTHOR, 'a-1', {
      title: 'What Romans 8 really showed me',
    });

    expect(updates[0].status).toBe('PENDING_REVIEW');
    expect(review.notifyReviewers).toHaveBeenCalledTimes(1);
  });

  it('requires fresh approval when a scripture citation changes', async () => {
    const { service, updates, review } = makeService(PUBLISHED);
    await service.update(AUTHOR, 'a-1', { scriptureLabel: 'Romans 8:28' });

    expect(updates[0].status).toBe('PENDING_REVIEW');
    expect(review.notifyReviewers).toHaveBeenCalled();
  });

  it('lets an author withdraw a piece from review', async () => {
    const { service, updates, review } = makeService(PENDING);
    await service.update(AUTHOR, 'a-1', { status: 'DRAFT' });

    expect(updates[0].status).toBe('DRAFT');
    expect(review.notifyReviewers).not.toHaveBeenCalled();
  });

  it('does not notify reviewers twice for a piece already waiting', async () => {
    const { service, review } = makeService(PENDING);
    await service.update(AUTHOR, 'a-1', {
      body: 'y'.repeat(60),
      status: 'PUBLISHED',
    });
    expect(review.notifyReviewers).not.toHaveBeenCalled();
  });
});

describe('moderation', () => {
  it('lets a pastor archive a piece but not rewrite it', async () => {
    const { service, updates } = makeService(PUBLISHED);

    await service.update(PASTOR, 'a-1', { status: 'ARCHIVED' });
    expect(updates[0].status).toBe('ARCHIVED');

    await expect(
      service.update(PASTOR, 'a-1', { title: 'Rewritten' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("refuses to let a pastor delete somebody else's writing", async () => {
    const { service } = makeService(PUBLISHED);
    await expect(service.remove(PASTOR, 'a-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("hides an ordinary member's attempt to touch a piece that is not theirs", async () => {
    const { service } = makeService(PUBLISHED);
    await expect(
      service.update(READER, 'a-1', { title: 'Mine now' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('only lets a pastor or admin feature a piece', async () => {
    const { service } = makeService(PUBLISHED);
    await expect(
      service.setFeatured(READER, 'a-1', true),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('likes', () => {
  it('counts a double tap once', async () => {
    const { service, likes } = makeService(PUBLISHED);

    const first = await service.setLike(READER, 'a-1', true);
    const second = await service.setLike(READER, 'a-1', true);

    expect(likes.size).toBe(1);
    expect(first.likeCount).toBe(1);
    expect(second.likeCount).toBe(1);
    expect(second.likedByMe).toBe(true);
  });

  it('un-likes once, however many times it is asked', async () => {
    const { service, likes } = makeService(PUBLISHED);
    await service.setLike(READER, 'a-1', true);

    const removed = await service.setLike(READER, 'a-1', false);
    const again = await service.setLike(READER, 'a-1', false);

    expect(likes.size).toBe(0);
    expect(removed.likedByMe).toBe(false);
    expect(again.likeCount).toBe(0);
  });

  it('cannot like a draft', async () => {
    // findFirst is filtered on PUBLISHED, so a draft simply is not found.
    const { service } = makeService(null);
    await expect(service.setLike(READER, 'a-1', true)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('writing', () => {
  it('derives a slug, an excerpt and a reading time from the body', async () => {
    const { service, prisma } = makeService(null);
    const body = 'word '.repeat(400);

    await service.create(AUTHOR, { title: 'What Romans 8 showed me!', body });

    const data = (prisma.memberArticle.create as jest.Mock).mock.calls[0][0]
      .data;
    expect(data.slug).toBe('what-romans-8-showed-me');
    expect(data.readingMinutes).toBe(2);
    expect(data.excerpt.length).toBeLessThanOrEqual(280);
    expect(data.status).toBe('DRAFT');
  });

  it('submits for review when a member publishes straight from the editor', async () => {
    const { service, prisma, review } = makeService(null);

    await service.create(AUTHOR, {
      title: 'A word for today',
      body: 'x'.repeat(50),
      publish: true,
    });

    const data = (prisma.memberArticle.create as jest.Mock).mock.calls[0][0]
      .data;
    expect(data.status).toBe('PENDING_REVIEW');
    expect(data.submittedAt).toBeInstanceOf(Date);
    expect(data.publishedAt).toBeNull();
    expect(review.notifyReviewers).toHaveBeenCalledWith({
      title: 'A word for today',
      authorId: 'author-1',
    });
  });

  it('submits a reviewer?s own article for approval', async () => {
    const { service, prisma, review } = makeService(null, { reviewer: true });

    await service.create(AUTHOR, {
      title: 'A word for today',
      body: 'x'.repeat(50),
      publish: true,
    });

    const data = (prisma.memberArticle.create as jest.Mock).mock.calls[0][0]
      .data;
    expect(data.status).toBe('PENDING_REVIEW');
    expect(data.publishedAt).toBeNull();
    expect(review.notifyReviewers).toHaveBeenCalled();
  });

  it('refuses half a scripture citation', async () => {
    const { service } = makeService(null);

    await expect(
      service.create(AUTHOR, {
        title: 'Half a reference',
        body: 'x'.repeat(50),
        startVerseId: 45001001,
      }),
    ).rejects.toThrow(/both a start and an end/);
  });
});
