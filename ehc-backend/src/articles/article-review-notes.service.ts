import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InboxService } from '../inbox/inbox.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { ArticleReviewService } from './article-review.service';

/**
 * Private notes between an article's author and its reviewers, as comments
 * and suggestions work in Google Docs: about the whole piece or about a
 * highlighted passage, with suggested wording if the reviewer has some. A note
 * never approves or returns the piece; that stays a separate decision. Readers
 * never see these.
 */
@Injectable()
export class ArticleReviewNotesService {
  private readonly logger = new Logger(ArticleReviewNotesService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    private readonly review: ArticleReviewService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** The author and reviewers may take part; anyone else is told it does not exist. */
  private async access(actor: AuthUser, articleId: string) {
    if (!actor.profileId) throw new ForbiddenException('Sign in to see review notes');
    const article = await this.prisma.memberArticle.findFirst({
      where: { id: articleId, tenantId: this.tenantId },
      select: { id: true, title: true, slug: true, authorId: true },
    });
    if (!article) throw new NotFoundException('Article not found');
    const isAuthor = article.authorId === actor.profileId;
    const isReviewer = !isAuthor && (await this.review.canReview(actor));
    if (!isAuthor && !isReviewer) throw new NotFoundException('Article not found');
    return { article, isAuthor, isReviewer, profileId: actor.profileId };
  }

  async list(actor: AuthUser, articleId: string) {
    const { isAuthor, isReviewer, profileId } = await this.access(actor, articleId);
    const notes = await this.prisma.articleReviewNote.findMany({
      where: { articleId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        authorName: true,
        fromReviewer: true,
        body: true,
        quote: true,
        suggestion: true,
        resolvedAt: true,
        createdAt: true,
        profileId: true,
      },
    });
    return {
      isAuthor,
      isReviewer,
      notes: notes.map(({ profileId: writer, ...n }) => ({ ...n, mine: writer === profileId })),
    };
  }

  async add(actor: AuthUser, articleId: string, input: { body: string; quote?: string | null; suggestion?: string | null }) {
    const { article, isAuthor, profileId } = await this.access(actor, articleId);
    const body = input.body.trim();
    if (!body) throw new BadRequestException('Write the comment first.');
    const quote = input.quote?.trim() || null;
    const suggestion = input.suggestion?.trim() || null;
    if (suggestion && !quote) throw new BadRequestException('Highlight the words a suggestion should replace.');

    const member = await this.prisma.member.findUnique({ where: { profileId }, select: { firstName: true, lastName: true } });
    const authorName = member ? `${member.firstName} ${member.lastName}`.trim() : 'A reviewer';
    const note = await this.prisma.articleReviewNote.create({
      data: { id: randomUUID(), tenantId: this.tenantId, articleId, profileId, authorName, fromReviewer: !isAuthor, body, quote, suggestion },
      select: { id: true, authorName: true, fromReviewer: true, body: true, quote: true, suggestion: true, resolvedAt: true, createdAt: true },
    });

    // A reviewer's note goes to the author; the author's reply to whoever reviewed it.
    const recipients = isAuthor
      ? Array.from(
          new Set(
            (
              await this.prisma.articleReviewNote.findMany({
                where: { articleId, fromReviewer: true },
                select: { profileId: true },
              })
            ).map((n) => n.profileId),
          ),
        ).filter((id) => id !== profileId)
      : [article.authorId];
    if (recipients.length) {
      await this.inbox
        .createMany(
          recipients.map((recipient) => ({
            tenantId: this.tenantId,
            profileId: recipient,
            type: 'article-review-note',
            title: isAuthor ? `${authorName} replied on "${article.title}"` : `${authorName} commented on your story "${article.title}"`,
            body: quote ? `On "${quote.slice(0, 60)}${quote.length > 60 ? '…' : ''}": ${body.slice(0, 100)}` : body.slice(0, 140),
            link: `/dashboard/articles/${article.slug}#review-notes`,
          })),
        )
        .catch((err: Error) => this.logger.warn(`Review note notification failed: ${err.message}`));
    }
    return { ...note, mine: true };
  }

  /** The author, or a reviewer, marks a note dealt with (or opens it again). */
  async resolve(actor: AuthUser, articleId: string, noteId: string, resolved: boolean) {
    await this.access(actor, articleId);
    const { count } = await this.prisma.articleReviewNote.updateMany({
      where: { id: noteId, articleId },
      data: { resolvedAt: resolved ? new Date() : null },
    });
    if (!count) throw new NotFoundException('That note is gone');
    return { id: noteId, resolved };
  }

  /** Only the person who wrote a note can delete it. */
  async remove(actor: AuthUser, articleId: string, noteId: string) {
    const { profileId } = await this.access(actor, articleId);
    const note = await this.prisma.articleReviewNote.findFirst({ where: { id: noteId, articleId }, select: { profileId: true } });
    if (!note) throw new NotFoundException('That note is gone');
    if (note.profileId !== profileId) throw new ForbiddenException('Only its writer can delete a note');
    await this.prisma.articleReviewNote.delete({ where: { id: noteId } });
    return { id: noteId, deleted: true };
  }
}
