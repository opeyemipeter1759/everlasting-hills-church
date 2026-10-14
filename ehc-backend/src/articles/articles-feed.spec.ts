import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { ArticlesService } from './articles.service';

const READER = { tenantId: 'tenant-1', profileId: 'reader-1', effectiveRoles: [Role.MEMBER] } as AuthUser;

function setup(published: { id: string } | null = { id: 'a-1' }) {
  const prisma = {
    memberArticle: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'a-1',
          slug: 'a-word',
          title: 'A word',
          Likes: [],
          Bookmarks: [{ id: 'b-1' }],
          _count: { Comments: 3 },
        },
      ]),
      count: jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue(published),
    },
    articleBookmark: {
      upsert: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const config = { get: () => 'tenant-1' } as never;
  const svc = new ArticlesService(prisma as never, config, {} as never);
  return { svc, prisma };
}

describe('The article feed', () => {
  it('shows what I saved and how many responses each has', async () => {
    const { svc } = setup();
    const { articles } = await svc.feed(READER, {});
    expect(articles[0]).toMatchObject({ bookmarkedByMe: true, commentCount: 3, likedByMe: false });
  });

  it('filters by tab and searches titles, subtitles and passages', async () => {
    const { svc, prisma } = setup();
    await svc.feed(READER, { tab: 'saved', q: ' Romans ' });
    const where = prisma.memberArticle.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ status: 'PUBLISHED', Bookmarks: { some: { profileId: 'reader-1' } } });
    expect(where.OR).toHaveLength(3);
    expect(where.OR[0]).toEqual({ title: { contains: 'Romans', mode: 'insensitive' } });

    await svc.feed(READER, { tab: 'featured' });
    expect(prisma.memberArticle.findMany.mock.calls[1][0].where).toMatchObject({ featuredAt: { not: null } });
  });
});

describe('Saving an article for later', () => {
  it('saves and unsaves, only for published pieces', async () => {
    const { svc, prisma } = setup();
    await expect(svc.setBookmark(READER, 'a-1', true)).resolves.toEqual({ id: 'a-1', bookmarkedByMe: true });
    expect(prisma.articleBookmark.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { articleId_profileId: { articleId: 'a-1', profileId: 'reader-1' } } }),
    );
    await expect(svc.setBookmark(READER, 'a-1', false)).resolves.toEqual({ id: 'a-1', bookmarkedByMe: false });
    expect(prisma.articleBookmark.deleteMany).toHaveBeenCalledWith({ where: { articleId: 'a-1', profileId: 'reader-1' } });

    const { svc: draftOnly } = setup(null);
    await expect(draftOnly.setBookmark(READER, 'draft', true)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('Deleting somebody else’s article', () => {
  it('lets a super admin delete any article', async () => {
    const del = jest.fn().mockResolvedValue({});
    const prisma = {
      memberArticle: {
        findFirst: jest.fn().mockResolvedValue({ id: 'a-1', authorId: 'someone-else', tenantId: 'tenant-1' }),
        delete: del,
      },
    };
    const svc = new ArticlesService(prisma as never, { get: () => 'tenant-1' } as never, {} as never);
    const superAdmin = { tenantId: 'tenant-1', profileId: 'sa-1', effectiveRoles: [Role.MEMBER, Role.SUPER_ADMIN] } as AuthUser;
    await expect(svc.remove(superAdmin, 'a-1')).resolves.toEqual({ id: 'a-1', deleted: true });
    expect(del).toHaveBeenCalledWith({ where: { id: 'a-1' } });
  });
});
