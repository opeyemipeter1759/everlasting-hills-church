import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { ArticleReviewNotesService } from './article-review-notes.service';

const ARTICLE = { id: 'a-1', title: 'A word', slug: 'a-word', authorId: 'author-p' };
const user = (profileId: string, roles: Role[] = [Role.MEMBER]) => ({ tenantId: 'tenant', profileId, effectiveRoles: roles }) as AuthUser;

function setup(reviewer = true) {
  const prisma = {
    memberArticle: { findFirst: jest.fn().mockResolvedValue(ARTICLE) },
    member: { findUnique: jest.fn().mockResolvedValue({ firstName: 'Ada', lastName: 'Obi' }) },
    articleReviewNote: {
      create: jest.fn(({ data }) => Promise.resolve({ ...data, resolvedAt: null, createdAt: new Date() })),
      findMany: jest.fn().mockResolvedValue([{ profileId: 'reviewer-p' }]),
      findFirst: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
  const inbox = { createMany: jest.fn().mockResolvedValue(1) };
  const review = { canReview: jest.fn().mockResolvedValue(reviewer) };
  const svc = new ArticleReviewNotesService(prisma as never, inbox as never, review as never, { get: () => 'tenant' } as never);
  return { svc, prisma, inbox };
}

describe('Review notes on an article', () => {
  it('lets a reviewer comment on a highlighted passage with a suggestion, without deciding, and tells the author', async () => {
    const { svc, prisma, inbox } = setup();
    await svc.add(user('reviewer-p', [Role.ADMIN]), 'a-1', { body: 'Clearer this way?', quote: 'the Lord is good', suggestion: 'the LORD is good' });
    expect(prisma.articleReviewNote.create.mock.calls[0][0].data).toMatchObject({
      fromReviewer: true,
      quote: 'the Lord is good',
      suggestion: 'the LORD is good',
      authorName: 'Ada Obi',
    });
    expect(inbox.createMany).toHaveBeenCalledWith([
      expect.objectContaining({ profileId: 'author-p', link: '/dashboard/articles/a-word#review-notes' }),
    ]);
  });

  it('sends the author’s reply to the reviewers who commented', async () => {
    const { svc, inbox } = setup(false);
    await svc.add(user('author-p'), 'a-1', { body: 'Changed it, thank you' });
    expect(inbox.createMany).toHaveBeenCalledWith([expect.objectContaining({ profileId: 'reviewer-p' })]);
  });

  it('keeps everyone else out', async () => {
    const { svc } = setup(false);
    await expect(svc.list(user('stranger-p'), 'a-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('needs words, and a highlight for a suggestion', async () => {
    const { svc } = setup();
    await expect(svc.add(user('reviewer-p'), 'a-1', { body: '  ' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.add(user('reviewer-p'), 'a-1', { body: 'Try', suggestion: 'New words' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets only its writer delete a note', async () => {
    const { svc, prisma } = setup();
    prisma.articleReviewNote.findFirst.mockResolvedValue({ profileId: 'other-p' });
    await expect(svc.remove(user('reviewer-p'), 'a-1', 'n-1')).rejects.toBeInstanceOf(ForbiddenException);
    prisma.articleReviewNote.findFirst.mockResolvedValue({ profileId: 'reviewer-p' });
    await expect(svc.remove(user('reviewer-p'), 'a-1', 'n-1')).resolves.toEqual({ id: 'n-1', deleted: true });
  });
});
