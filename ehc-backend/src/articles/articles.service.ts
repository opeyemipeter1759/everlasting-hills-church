import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ArticleStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { stripMarkdown } from '../common/markdown.util';
import { ArticleReviewService } from './article-review.service';

/** Words a minute, the same figure the reading plan estimates with. */
const WORDS_PER_MINUTE = 200;

const ADMIN_ROLES: Role[] = [
  Role.ADMIN,
  Role.ADMIN_HEAD,
  Role.PASTOR,
  Role.SUPER_ADMIN,
];

/**
 * Member written articles.
 *
 * A member reads Romans 8 in the morning and has something to say about it.
 * This is where that goes: their own writing, published to the church, with the
 * passage it came from cited as a verse range so everything written about a
 * chapter can be found together later.
 *
 * Drafts are private to their author. Publishing goes through review: a member
 * submits, and the head of the department that owns the Content Writing Team
 * approves it or sends it back with a note (see ArticleReviewService). Pastors
 * and admins can review too, and can still archive a published piece.
 */
@Injectable()
export class ArticlesService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
    private readonly review: ArticleReviewService,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private profileOrThrow(actor: AuthUser): string {
    if (!actor.profileId)
      throw new ForbiddenException('No profile linked to this account');
    if (actor.tenantId !== this.tenantId)
      throw new ForbiddenException('This account belongs to another church');
    return actor.profileId;
  }

  private isModerator(actor: AuthUser): boolean {
    return (actor.effectiveRoles ?? []).some((role) =>
      ADMIN_ROLES.includes(role),
    );
  }

  /**
   * A URL safe slug, made unique per church by a short suffix when it collides.
   * Two people writing "What Romans 8 showed me" is a good problem, not an error.
   */
  private async uniqueSlug(title: string): Promise<string> {
    const base =
      stripMarkdown(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'article';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug = attempt === 0 ? base : `${base}-${randomUUID().slice(0, 6)}`;
      const clash = await this.prisma.memberArticle.findFirst({
        where: { tenantId: this.tenantId, slug },
        select: { id: true },
      });
      if (!clash) return slug;
    }
    return `${base}-${randomUUID().slice(0, 8)}`;
  }

  private summarise(body: string) {
    const plain = stripMarkdown(body);
    return {
      excerpt: plain.slice(0, 280),
      readingMinutes: Math.max(
        1,
        Math.round(
          plain.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE,
        ),
      ),
    };
  }

  private authorSelect() {
    return {
      id: true,
      Member: { select: { firstName: true, lastName: true, photoUrl: true } },
    };
  }

  /** The church's feed: published pieces, newest first, featured ones lifted. */
  async feed(
    actor: AuthUser,
    options: { page?: number; limit?: number; authorId?: string } = {},
  ) {
    const profileId = this.profileOrThrow(actor);
    const take = Math.min(Math.max(options.limit ?? 20, 1), 50);
    const skip = (Math.max(options.page ?? 1, 1) - 1) * take;

    const where = {
      tenantId: this.tenantId,
      status: ArticleStatus.PUBLISHED,
      ...(options.authorId ? { authorId: options.authorId } : {}),
    };

    const [articles, total] = await Promise.all([
      this.prisma.memberArticle.findMany({
        where,
        orderBy: [
          { featuredAt: { sort: 'desc', nulls: 'last' } },
          { publishedAt: 'desc' },
        ],
        skip,
        take,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImageUrl: true,
          scriptureLabel: true,
          readingMinutes: true,
          likeCount: true,
          featuredAt: true,
          publishedAt: true,
          Author: { select: this.authorSelect() },
          Likes: { where: { profileId }, select: { id: true } },
        },
      }),
      this.prisma.memberArticle.count({ where }),
    ]);

    return {
      articles: articles.map(({ Likes, ...article }) => ({
        ...article,
        likedByMe: Likes.length > 0,
      })),
      meta: { page: Math.max(options.page ?? 1, 1), limit: take, total },
    };
  }

  /** Authors see their drafts; authorized reviewers can read pending submissions. */
  async bySlug(actor: AuthUser, slug: string) {
    const profileId = this.profileOrThrow(actor);
    const article = await this.prisma.memberArticle.findFirst({
      where: { tenantId: this.tenantId, slug },
      include: {
        Author: { select: this.authorSelect() },
        Likes: { where: { profileId }, select: { id: true } },
      },
    });
    if (!article) throw new NotFoundException('Article not found');

    const isAuthor = article.authorId === profileId;
    // Whoever reviews a piece has to be able to read it while it waits.
    const canReview =
      article.status === ArticleStatus.PENDING_REVIEW && !isAuthor
        ? await this.review.canReview(actor)
        : false;
    if (article.status !== ArticleStatus.PUBLISHED && !isAuthor && !canReview) {
      // Anything unpublished that is not yours to write or review does not
      // exist, as far as you are concerned.
      throw new NotFoundException('Article not found');
    }

    // Counted on read of a published piece, and never for the author's own
    // visits, so a writer refreshing their own page does not inflate it.
    if (article.status === ArticleStatus.PUBLISHED && !isAuthor) {
      await this.prisma.memberArticle.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    const { Likes, ...rest } = article;
    return {
      ...rest,
      // Editorial feedback belongs to the author and their reviewer.
      reviewNote: isAuthor || canReview ? rest.reviewNote : null,
      reviewedById: isAuthor || canReview ? rest.reviewedById : null,
      likedByMe: Likes.length > 0,
      isAuthor,
      canReview,
    };
  }

  /** Everything the caller has written, drafts included. */
  async mine(actor: AuthUser) {
    const profileId = this.profileOrThrow(actor);
    return this.prisma.memberArticle.findMany({
      where: { tenantId: this.tenantId, authorId: profileId },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        status: true,
        scriptureLabel: true,
        readingMinutes: true,
        likeCount: true,
        viewCount: true,
        publishedAt: true,
        updatedAt: true,
        submittedAt: true,
        reviewedAt: true,
        reviewNote: true,
      },
    });
  }

  async create(
    actor: AuthUser,
    input: {
      title: string;
      body: string;
      startVerseId?: number;
      endVerseId?: number;
      scriptureLabel?: string;
      publish?: boolean;
    },
  ) {
    const profileId = this.profileOrThrow(actor);
    this.assertVerseRange(input.startVerseId, input.endVerseId);

    const { excerpt, readingMinutes } = this.summarise(input.body);
    // Every author submits for another person's approval, including reviewers.
    const status = input.publish
      ? ArticleStatus.PENDING_REVIEW
      : ArticleStatus.DRAFT;
    const now = new Date();

    const created = await this.prisma.memberArticle.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        authorId: profileId,
        slug: await this.uniqueSlug(input.title),
        title: input.title.trim(),
        body: input.body,
        excerpt,
        readingMinutes,
        startVerseId: input.startVerseId ?? null,
        endVerseId: input.endVerseId ?? null,
        scriptureLabel: input.scriptureLabel ?? null,
        status,
        publishedAt: null,
        submittedAt: status === ArticleStatus.PENDING_REVIEW ? now : null,
      },
      select: { id: true, slug: true, status: true },
    });

    if (status === ArticleStatus.PENDING_REVIEW) {
      await this.review.notifyReviewers({
        title: input.title.trim(),
        authorId: profileId,
      });
    }
    return created;
  }

  private async ownedOrThrow(actor: AuthUser, id: string) {
    const profileId = this.profileOrThrow(actor);
    const article = await this.prisma.memberArticle.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!article) throw new NotFoundException('Article not found');

    const isAuthor = article.authorId === profileId;
    if (!isAuthor && !this.isModerator(actor)) {
      throw new NotFoundException('Article not found');
    }
    return { article, isAuthor };
  }

  async update(
    actor: AuthUser,
    id: string,
    input: {
      title?: string;
      body?: string;
      startVerseId?: number | null;
      endVerseId?: number | null;
      scriptureLabel?: string | null;
      status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
      revision?: number;
    },
  ) {
    const { article, isAuthor } = await this.ownedOrThrow(actor, id);
    if (input.revision !== undefined && input.revision !== article.revision) {
      throw new ConflictException(
        'This article has changed. Reload it before saving.',
      );
    }

    // A moderator may archive somebody's piece. They may not rewrite it.
    if (!isAuthor) {
      if (input.status !== 'ARCHIVED') {
        throw new ForbiddenException(
          'You can archive this article, but not edit it',
        );
      }
      const { count } = await this.prisma.memberArticle.updateMany({
        where: { id, tenantId: this.tenantId, revision: article.revision },
        data: { status: ArticleStatus.ARCHIVED, revision: { increment: 1 } },
      });
      if (!count)
        throw new ConflictException(
          'This article has changed. Reload it before saving.',
        );
      return { id, slug: article.slug, status: ArticleStatus.ARCHIVED };
    }

    if (input.startVerseId !== undefined || input.endVerseId !== undefined) {
      // Validated against what the row will hold afterwards, which is not the
      // same as what was sent: null clears a verse and undefined leaves it
      // alone, and clearing only one end would fail the CHECK constraint at the
      // database rather than here.
      const nextStart =
        input.startVerseId !== undefined
          ? input.startVerseId
          : article.startVerseId;
      const nextEnd =
        input.endVerseId !== undefined ? input.endVerseId : article.endVerseId;
      this.assertVerseRange(nextStart ?? undefined, nextEnd ?? undefined);
    }

    const summary = input.body ? this.summarise(input.body) : null;

    // Content and citation edits to a published article require fresh approval.
    let status = input.status as ArticleStatus | undefined;
    const rewritten =
      (input.title !== undefined && input.title.trim() !== article.title) ||
      (input.body !== undefined && input.body !== article.body) ||
      (input.scriptureLabel !== undefined &&
        input.scriptureLabel !== article.scriptureLabel) ||
      (input.startVerseId !== undefined &&
        input.startVerseId !== article.startVerseId) ||
      (input.endVerseId !== undefined &&
        input.endVerseId !== article.endVerseId);
    if (status === ArticleStatus.PUBLISHED) {
      status = ArticleStatus.PENDING_REVIEW;
    } else if (
      status === undefined &&
      article.status === ArticleStatus.PUBLISHED &&
      rewritten
    ) {
      status = ArticleStatus.PENDING_REVIEW;
    }
    const submitting =
      status === ArticleStatus.PENDING_REVIEW &&
      article.status !== ArticleStatus.PENDING_REVIEW;

    const { count } = await this.prisma.memberArticle.updateMany({
      where: { id, tenantId: this.tenantId, revision: article.revision },
      data: {
        revision: { increment: 1 },
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.body !== undefined && { body: input.body }),
        ...(summary && {
          excerpt: summary.excerpt,
          readingMinutes: summary.readingMinutes,
        }),
        ...(input.startVerseId !== undefined && {
          startVerseId: input.startVerseId,
        }),
        ...(input.endVerseId !== undefined && { endVerseId: input.endVerseId }),
        ...(input.scriptureLabel !== undefined && {
          scriptureLabel: input.scriptureLabel,
        }),
        ...(status !== undefined && { status }),
        ...(submitting && { submittedAt: new Date() }),
        ...(submitting && {
          reviewedAt: null,
          reviewedById: null,
          reviewNote: null,
        }),
      },
    });
    if (!count)
      throw new ConflictException(
        'This article has changed. Reload it before saving.',
      );

    if (submitting) {
      await this.review.notifyReviewers({
        title: input.title?.trim() || article.title,
        authorId: article.authorId,
      });
    }
    return { id, slug: article.slug, status: status ?? article.status };
  }

  async remove(actor: AuthUser, id: string) {
    const { isAuthor } = await this.ownedOrThrow(actor, id);
    if (!isAuthor) {
      throw new ForbiddenException(
        'Only the author can delete an article. Archive it instead.',
      );
    }
    await this.prisma.memberArticle.delete({ where: { id } });
    return { id, deleted: true };
  }

  /** Feature or unfeature a piece, which lifts it to the top of the feed. */
  async setFeatured(actor: AuthUser, id: string, featured: boolean) {
    if (!this.isModerator(actor)) {
      throw new ForbiddenException(
        'Only a pastor or admin can feature an article',
      );
    }
    const article = await this.prisma.memberArticle.findFirst({
      where: { id, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!article) throw new NotFoundException('Article not found');

    return this.prisma.memberArticle.update({
      where: { id },
      data: { featuredAt: featured ? new Date() : null },
      select: { id: true, featuredAt: true },
    });
  }

  /**
   * Likes, idempotent in both directions.
   *
   * The unique index on (articleId, profileId) decides, so a double tap adds
   * one like and un-liking twice removes one. The counter on the article is
   * only ever moved when a row is actually written or removed.
   */
  async setLike(actor: AuthUser, id: string, liked: boolean) {
    const profileId = this.profileOrThrow(actor);
    const article = await this.prisma.memberArticle.findFirst({
      where: { id, tenantId: this.tenantId, status: ArticleStatus.PUBLISHED },
      select: { id: true },
    });
    if (!article) throw new NotFoundException('Article not found');

    return this.prisma.$transaction(async (tx) => {
      if (liked) {
        const created = await tx.memberArticleLike.createMany({
          data: [
            {
              id: randomUUID(),
              tenantId: this.tenantId,
              articleId: id,
              profileId,
            },
          ],
          skipDuplicates: true,
        });
        if (created.count === 0) {
          const current = await tx.memberArticle.findUnique({
            where: { id },
            select: { likeCount: true },
          });
          return { likeCount: current!.likeCount, likedByMe: true };
        }
        const updated = await tx.memberArticle.update({
          where: { id },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true },
        });
        return { likeCount: updated.likeCount, likedByMe: true };
      }

      const { count } = await tx.memberArticleLike.deleteMany({
        where: { articleId: id, profileId },
      });
      if (count === 0) {
        const current = await tx.memberArticle.findUnique({
          where: { id },
          select: { likeCount: true },
        });
        return { likeCount: current!.likeCount, likedByMe: false };
      }
      const updated = await tx.memberArticle.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
      return { likeCount: updated.likeCount, likedByMe: false };
    });
  }

  private assertVerseRange(start?: number, end?: number) {
    if (start === undefined && end === undefined) return;
    if (start === undefined || end === undefined) {
      throw new BadRequestException(
        'A scripture citation needs both a start and an end verse',
      );
    }
    if (end < start) {
      throw new BadRequestException(
        'The end of the passage is before its start',
      );
    }
  }
}
