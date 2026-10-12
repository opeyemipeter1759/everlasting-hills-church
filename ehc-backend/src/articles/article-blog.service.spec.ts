import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ArticleBlogService } from './article-blog.service';

const config = { get: () => 'tenant' } as never;
const ARTICLE = { id: 'a-1', title: 'A word', authorId: 'author-p', slug: 'a-word' };

function setup(article: Record<string, unknown> | null = ARTICLE) {
  const prisma = {
    memberArticle: { findFirst: jest.fn().mockResolvedValue(article) },
    member: { findUnique: jest.fn().mockResolvedValue({ firstName: 'Bayo', lastName: 'Ade' }) },
    articleComment: {
      create: jest.fn(({ data }) => Promise.resolve({ id: data.id, authorName: data.authorName, body: data.body, createdAt: new Date() })),
      findFirst: jest.fn(),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
  const inbox = { createMany: jest.fn().mockResolvedValue(1) };
  return { svc: new ArticleBlogService(prisma as never, inbox as never, config), prisma, inbox };
}

const member = (over: Record<string, unknown> = {}) => ({ profileId: 'reader-p', effectiveRoles: [Role.MEMBER], ...over }) as never;

describe('Comments on the public blog', () => {
  it('takes a visitor’s comment with the name they give, and tells the author', async () => {
    const { svc, prisma, inbox } = setup();
    await svc.comment('a-word', { name: '  Tunde  ', body: ' Blessed by this ' }, null);
    expect(prisma.articleComment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ authorName: 'Tunde', body: 'Blessed by this', profileId: null }) }),
    );
    expect(inbox.createMany).toHaveBeenCalledWith([
      expect.objectContaining({ profileId: 'author-p', title: 'Tunde commented on "A word"' }),
    ]);
  });

  it('signs a member’s comment with their own name', async () => {
    const { svc, prisma } = setup();
    await svc.comment('a-word', { body: 'Amen' }, member());
    expect(prisma.articleComment.create.mock.calls[0][0].data).toMatchObject({ authorName: 'Bayo Ade', profileId: 'reader-p' });
  });

  it('needs a name and words, and a published article', async () => {
    const { svc } = setup();
    await expect(svc.comment('a-word', { name: ' ', body: 'Hi' }, null)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.comment('a-word', { name: 'Tunde', body: '  ' }, null)).rejects.toBeInstanceOf(BadRequestException);
    const { svc: none } = setup(null);
    await expect(none.comment('draft', { name: 'Tunde', body: 'Hi' }, null)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lets the writer, the article’s author or an admin remove a comment', async () => {
    const { svc, prisma } = setup();
    prisma.articleComment.findFirst.mockResolvedValue({ id: 'c-1', profileId: 'writer-p', Article: { authorId: 'author-p' } });
    await expect(svc.deleteComment('c-1', member())).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.deleteComment('c-1', member({ profileId: 'writer-p' }))).resolves.toEqual({ ok: true });
    await expect(svc.deleteComment('c-1', member({ profileId: 'author-p' }))).resolves.toEqual({ ok: true });
    await expect(svc.deleteComment('c-1', member({ effectiveRoles: [Role.ADMIN] }))).resolves.toEqual({ ok: true });
  });

  it('keeps article management to pastors and admins', async () => {
    const { svc } = setup();
    await expect(svc.adminList(member(), {})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.recentComments(member())).rejects.toBeInstanceOf(ForbiddenException);
  });
});
