import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ArticlesService } from './articles.service';
import type { AuthUser } from '../auth/types/auth-user';

/**
 * The rules that decide whether members will actually write here.
 *
 * Drafts are private, publishing is the author's own decision, and moderation
 * happens after the fact. A church that makes people wait for permission to say
 * what they are learning gets silence instead of articles.
 */
const AUTHOR = { profileId: 'author-1', effectiveRoles: [Role.MEMBER] } as AuthUser;
const READER = { profileId: 'reader-1', effectiveRoles: [Role.MEMBER] } as AuthUser;
const PASTOR = { profileId: 'pastor-1', effectiveRoles: [Role.MEMBER, Role.PASTOR] } as AuthUser;

function makeService(article: Record<string, unknown> | null) {
  const updates: Record<string, unknown>[] = [];
  const likes = new Set<string>();

  const tx = {
    memberArticleLike: {
      createMany: jest.fn(async ({ data }: { data: { profileId: string }[] }) => {
        const key = data[0].profileId;
        if (likes.has(key)) return { count: 0 };
        likes.add(key);
        return { count: 1 };
      }),
      deleteMany: jest.fn(async ({ where }: { where: { profileId: string } }) => ({
        count: likes.delete(where.profileId) ? 1 : 0,
      })),
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
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => data),
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        return { id: 'a-1', slug: 'x', status: data.status ?? 'DRAFT' };
      }),
      delete: jest.fn(async () => ({})),
    },
    $transaction: jest.fn(async (fn: (client: unknown) => Promise<unknown>) => fn(tx)),
  };

  const service = new ArticlesService(prisma as never, {
    get: jest.fn().mockReturnValue('tenant-1'),
  } as never);

  return { service, prisma, updates, likes };
}

const DRAFT = {
  id: 'a-1',
  tenantId: 'tenant-1',
  authorId: 'author-1',
  slug: 'what-romans-8-showed-me',
  status: 'DRAFT',
  publishedAt: null,
  startVerseId: null,
  endVerseId: null,
  Likes: [],
};

const PUBLISHED = { ...DRAFT, status: 'PUBLISHED', publishedAt: new Date('2026-09-01') };

describe('reading an article', () => {
  it('shows an author their own draft', async () => {
    const { service } = makeService(DRAFT);
    const article = await service.bySlug(AUTHOR, DRAFT.slug);
    expect(article.isAuthor).toBe(true);
  });

  it('hides somebody else\'s draft rather than refusing it', async () => {
    // Not found, not forbidden: an unpublished piece should not be discoverable
    // by probing slugs.
    const { service } = makeService(DRAFT);
    await expect(service.bySlug(READER, DRAFT.slug)).rejects.toBeInstanceOf(NotFoundException);
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

describe('publishing and moderation', () => {
  it('lets an author publish without asking anybody', async () => {
    const { service, updates } = makeService(DRAFT);
    await service.update(AUTHOR, 'a-1', { status: 'PUBLISHED' });

    expect(updates[0].status).toBe('PUBLISHED');
    expect(updates[0].publishedAt).toBeInstanceOf(Date);
  });

  it('keeps the original publish date when an archived piece returns', async () => {
    const archived = { ...PUBLISHED, status: 'ARCHIVED' };
    const { service, updates } = makeService(archived);

    await service.update(AUTHOR, 'a-1', { status: 'PUBLISHED' });

    // The church first read it in September; re-publishing does not rewrite that.
    expect(updates[0].publishedAt).toBeUndefined();
  });

  it('lets a pastor archive a piece but not rewrite it', async () => {
    const { service, updates } = makeService(PUBLISHED);

    await service.update(PASTOR, 'a-1', { status: 'ARCHIVED' });
    expect(updates[0].status).toBe('ARCHIVED');

    await expect(service.update(PASTOR, 'a-1', { title: 'Rewritten' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('refuses to let a pastor delete somebody else\'s writing', async () => {
    const { service } = makeService(PUBLISHED);
    await expect(service.remove(PASTOR, 'a-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('hides an ordinary member\'s attempt to touch a piece that is not theirs', async () => {
    const { service } = makeService(PUBLISHED);
    await expect(service.update(READER, 'a-1', { title: 'Mine now' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('only lets a pastor or admin feature a piece', async () => {
    const { service } = makeService(PUBLISHED);
    await expect(service.setFeatured(READER, 'a-1', true)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
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
    await expect(service.setLike(READER, 'a-1', true)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('writing', () => {
  it('derives a slug, an excerpt and a reading time from the body', async () => {
    const { service, prisma } = makeService(null);
    const body = 'word '.repeat(400);

    await service.create(AUTHOR, { title: 'What Romans 8 showed me!', body });

    const data = (prisma.memberArticle.create as jest.Mock).mock.calls[0][0].data;
    expect(data.slug).toBe('what-romans-8-showed-me');
    expect(data.readingMinutes).toBe(2);
    expect(data.excerpt.length).toBeLessThanOrEqual(280);
    expect(data.status).toBe('DRAFT');
  });

  it('publishes straight away when asked to', async () => {
    const { service, prisma } = makeService(null);

    await service.create(AUTHOR, { title: 'A word for today', body: 'x'.repeat(50), publish: true });

    const data = (prisma.memberArticle.create as jest.Mock).mock.calls[0][0].data;
    expect(data.status).toBe('PUBLISHED');
    expect(data.publishedAt).toBeInstanceOf(Date);
  });

  it('refuses half a scripture citation', async () => {
    const { service } = makeService(null);

    await expect(
      service.create(AUTHOR, { title: 'Half a reference', body: 'x'.repeat(50), startVerseId: 45001001 }),
    ).rejects.toThrow(/both a start and an end/);
  });
});
