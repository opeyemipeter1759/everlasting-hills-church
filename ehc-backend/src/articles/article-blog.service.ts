import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArticleStatus, Prisma, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InboxService } from '../inbox/inbox.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';

const PAGE = 12;
const COMMENTS_PAGE = 20;
const MODERATORS: Role[] = [Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN];

const AUTHOR = { Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } } as const;
type Author = { Member: { id: string; firstName: string; lastName: string; photoUrl: string | null } | null };
const author = (a: Author) => ({
  memberId: a.Member?.id ?? null,
  name: a.Member ? `${a.Member.firstName} ${a.Member.lastName}`.trim() : 'A member',
  photoUrl: a.Member?.photoUrl ?? null,
});

/**
 * The public blog: published member articles anyone can read and share, and
 * comments from visitors or members. Nothing unpublished, and nothing about
 * readers, ever leaves through here. Admins and pastors moderate: they can
 * remove any comment and delete any article.
 */
@Injectable()
export class ArticleBlogService {
  private readonly logger = new Logger(ArticleBlogService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  isModerator(actor: AuthUser | null | undefined) {
    return (actor?.effectiveRoles ?? []).some((r) => MODERATORS.includes(r));
  }

  private published(slug: string) {
    return this.prisma.memberArticle.findFirst({
      where: { tenantId: this.tenantId, slug, status: ArticleStatus.PUBLISHED },
      select: { id: true, title: true, authorId: true, slug: true },
    });
  }

  async list(page = 1) {
    const current = Math.max(1, Math.floor(page) || 1);
    const where = { tenantId: this.tenantId, status: ArticleStatus.PUBLISHED };
    const [total, rows] = await Promise.all([
      this.prisma.memberArticle.count({ where }),
      this.prisma.memberArticle.findMany({
        where,
        orderBy: [{ featuredAt: { sort: 'desc', nulls: 'last' } }, { publishedAt: 'desc' }],
        skip: (current - 1) * PAGE,
        take: PAGE,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          subtitle: true,
          coverImageUrl: true,
          scriptureLabel: true,
          readingMinutes: true,
          likeCount: true,
          featuredAt: true,
          publishedAt: true,
          Author: { select: AUTHOR },
          _count: { select: { Comments: true } },
        },
      }),
    ]);
    return {
      items: rows.map(({ Author, _count, ...a }) => ({ ...a, author: author(Author), commentCount: _count.Comments })),
      total,
      page: current,
      pageSize: PAGE,
    };
  }

  async read(slug: string) {
    const a = await this.prisma.memberArticle.findFirst({
      where: { tenantId: this.tenantId, slug, status: ArticleStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        title: true,
        body: true,
        excerpt: true,
        subtitle: true,
        coverImageUrl: true,
        scriptureLabel: true,
        readingMinutes: true,
        likeCount: true,
        viewCount: true,
        publishedAt: true,
        Author: { select: AUTHOR },
        _count: { select: { Comments: true } },
      },
    });
    if (!a) throw new NotFoundException('Article not found');
    // A read from the public blog counts like one inside the app.
    await this.prisma.memberArticle.update({ where: { id: a.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
    const { Author, _count, ...rest } = a;
    return { ...rest, author: author(Author), commentCount: _count.Comments };
  }

  async comments(slug: string, page = 1, actor?: AuthUser | null) {
    const article = await this.published(slug);
    if (!article) throw new NotFoundException('Article not found');
    const current = Math.max(1, Math.floor(page) || 1);
    const where = { articleId: article.id };
    const [total, rows] = await Promise.all([
      this.prisma.articleComment.count({ where }),
      this.prisma.articleComment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (current - 1) * COMMENTS_PAGE,
        take: COMMENTS_PAGE,
        select: { id: true, authorName: true, body: true, createdAt: true, profileId: true },
      }),
    ]);
    // Members' photos, so a member's comment shows who they are.
    const profileIds = rows.map((r) => r.profileId).filter((p): p is string => !!p);
    const members = profileIds.length
      ? await this.prisma.member.findMany({ where: { profileId: { in: profileIds } }, select: { id: true, profileId: true, photoUrl: true } })
      : [];
    const byProfile = new Map(members.map((m) => [m.profileId, m]));
    const moderator = this.isModerator(actor);
    const isAuthor = !!actor?.profileId && actor.profileId === article.authorId;
    return {
      items: rows.map(({ profileId, ...c }) => ({
        ...c,
        isMember: !!profileId,
        memberId: profileId ? (byProfile.get(profileId)?.id ?? null) : null,
        photoUrl: profileId ? (byProfile.get(profileId)?.photoUrl ?? null) : null,
        canDelete: moderator || isAuthor || (!!actor?.profileId && actor.profileId === profileId),
      })),
      total,
      page: current,
      pageSize: COMMENTS_PAGE,
    };
  }

  /** A visitor's comment (a name they give) or a member's (their own name). */
  async comment(slug: string, input: { name?: string; body: string }, actor?: AuthUser | null) {
    const article = await this.published(slug);
    if (!article) throw new NotFoundException('Article not found');
    const body = input.body.trim();
    if (!body) throw new BadRequestException('Write a comment first.');

    let authorName = (input.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
    let profileId: string | null = null;
    if (actor?.profileId) {
      const member = await this.prisma.member.findUnique({ where: { profileId: actor.profileId }, select: { firstName: true, lastName: true } });
      profileId = actor.profileId;
      if (member) authorName = `${member.firstName} ${member.lastName}`.trim();
    }
    if (!authorName) throw new BadRequestException('Tell us your name.');

    const created = await this.prisma.articleComment.create({
      data: { id: randomUUID(), tenantId: this.tenantId, articleId: article.id, profileId, authorName, body },
      select: { id: true, authorName: true, body: true, createdAt: true },
    });
    if (article.authorId !== profileId) {
      await this.inbox
        .createMany([
          {
            tenantId: this.tenantId,
            profileId: article.authorId,
            title: `${authorName} commented on "${article.title}"`,
            body: body.length > 120 ? `${body.slice(0, 117)}…` : body,
            type: 'article-comment',
            link: `/dashboard/articles/${article.slug}#comments`,
          },
        ])
        .catch((err: Error) => this.logger.warn(`Comment notification failed: ${err.message}`));
    }
    return created;
  }

  /** The comment's writer, the article's author, or a moderator. */
  async deleteComment(commentId: string, actor: AuthUser) {
    const comment = await this.prisma.articleComment.findFirst({
      where: { id: commentId, tenantId: this.tenantId },
      select: { id: true, profileId: true, Article: { select: { authorId: true } } },
    });
    if (!comment) throw new NotFoundException('That comment is gone already.');
    const own = !!actor.profileId && (actor.profileId === comment.profileId || actor.profileId === comment.Article.authorId);
    if (!own && !this.isModerator(actor)) throw new ForbiddenException('Only the writer, the author or an admin can remove this.');
    await this.prisma.articleComment.delete({ where: { id: comment.id } });
    return { ok: true };
  }

  /** Every article in every state, for admins to manage. */
  async adminList(actor: AuthUser, query: { status?: string; q?: string; page?: number }) {
    if (!this.isModerator(actor)) throw new ForbiddenException('Only pastors and admins manage articles.');
    const current = Math.max(1, Math.floor(query.page ?? 1) || 1);
    const statuses = Object.values(ArticleStatus) as string[];
    const where: Prisma.MemberArticleWhereInput = {
      tenantId: this.tenantId,
      ...(query.status && statuses.includes(query.status) ? { status: query.status as ArticleStatus } : {}),
      ...(query.q?.trim() ? { title: { contains: query.q.trim(), mode: 'insensitive' } } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.memberArticle.count({ where }),
      this.prisma.memberArticle.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (current - 1) * 20,
        take: 20,
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          viewCount: true,
          likeCount: true,
          featuredAt: true,
          publishedAt: true,
          submittedAt: true,
          updatedAt: true,
          Author: { select: AUTHOR },
          _count: { select: { Comments: true } },
        },
      }),
    ]);
    return {
      items: rows.map(({ Author, _count, ...a }) => ({ ...a, author: author(Author), commentCount: _count.Comments })),
      total,
      page: current,
      pageSize: 20,
    };
  }

  /** The newest comments across all articles, for moderation. */
  async recentComments(actor: AuthUser) {
    if (!this.isModerator(actor)) throw new ForbiddenException('Only pastors and admins moderate comments.');
    const rows = await this.prisma.articleComment.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        authorName: true,
        body: true,
        createdAt: true,
        profileId: true,
        Article: { select: { title: true, slug: true } },
      },
    });
    return rows.map(({ profileId, Article, ...c }) => ({ ...c, isMember: !!profileId, article: Article }));
  }
}
