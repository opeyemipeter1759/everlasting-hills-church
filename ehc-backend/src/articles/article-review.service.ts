import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArticleStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InboxService } from '../inbox/inbox.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';

/**
 * The unit whose department reviews member articles. Resolved to its department
 * on each request rather than pinned to a department id or a person, so moving
 * the unit or changing its HOD needs no code change.
 */
export const CONTENT_TEAM_UNIT_NAME = 'Content Writing Team';

/**
 * Above HOD in the church's order, and already able to archive or feature an
 * article. They can approve as well, so a piece never waits forever because
 * the content department has no head.
 */
const OVERSEEING_ROLES: Role[] = [
  Role.ADMIN,
  Role.ADMIN_HEAD,
  Role.PASTOR,
  Role.SUPER_ADMIN,
];

/**
 * Review of member articles before the church reads them.
 *
 * A member writes and submits; the HOD of the department that owns the Content
 * Writing Team approves it or sends it back with a note. Reviewers' own pieces
 * publish directly — review exists to have a second pair of eyes on a piece,
 * and a reviewer's eyes are the ones it would have gone to anyway.
 */
@Injectable()
export class ArticleReviewService {
  private readonly logger = new Logger(ArticleReviewService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** The department that owns the Content Writing Team, or null if there is none. */
  async contentDepartmentId(): Promise<string | null> {
    const unit = await this.prisma.unit.findFirst({
      where: {
        tenantId: this.tenantId,
        name: { equals: CONTENT_TEAM_UNIT_NAME, mode: 'insensitive' },
      },
      select: { departmentId: true },
    });
    if (!unit?.departmentId) {
      this.logger.warn(
        `No "${CONTENT_TEAM_UNIT_NAME}" unit with a department — only pastors and admins can approve articles.`,
      );
      return null;
    }
    return unit.departmentId;
  }

  async canReview(actor: AuthUser): Promise<boolean> {
    if (!actor.profileId || actor.tenantId !== this.tenantId) return false;
    if (
      (actor.effectiveRoles ?? []).some((role) =>
        OVERSEEING_ROLES.includes(role),
      )
    )
      return true;
    if (!actor.hodOf?.length) return false;
    const departmentId = await this.contentDepartmentId();
    return departmentId !== null && actor.hodOf.includes(departmentId);
  }

  private async assertCanReview(actor: AuthUser) {
    if (!(await this.canReview(actor))) {
      throw new ForbiddenException(
        'Only the head of the content department, a pastor or an admin can review articles',
      );
    }
  }

  /** Whether to show the review tab, and how many pieces are waiting. */
  async access(actor: AuthUser) {
    const canReview = await this.canReview(actor);
    const pending = canReview
      ? await this.prisma.memberArticle.count({
          where: {
            tenantId: this.tenantId,
            status: ArticleStatus.PENDING_REVIEW,
            authorId: { not: actor.profileId! },
          },
        })
      : 0;
    return { canReview, pending };
  }

  /** Waiting pieces, oldest first: whoever has waited longest is read first. */
  async queue(actor: AuthUser) {
    await this.assertCanReview(actor);
    return this.prisma.memberArticle.findMany({
      where: {
        tenantId: this.tenantId,
        status: ArticleStatus.PENDING_REVIEW,
        authorId: { not: actor.profileId! },
      },
      orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        scriptureLabel: true,
        readingMinutes: true,
        submittedAt: true,
        Author: {
          select: {
            id: true,
            Member: {
              select: { firstName: true, lastName: true, photoUrl: true },
            },
          },
        },
      },
    });
  }

  async approve(actor: AuthUser, id: string, revision: number, note?: string) {
    await this.assertCanReview(actor);
    const article = await this.pending(id);
    this.assertReviewable(actor, article, revision);
    const now = new Date();

    // Conditional on the status still being PENDING_REVIEW, so two reviewers
    // acting at once cannot both approve, and an author withdrawing a piece at
    // the same moment wins or loses cleanly rather than being overwritten.
    const { count } = await this.prisma.memberArticle.updateMany({
      where: {
        id,
        tenantId: this.tenantId,
        status: ArticleStatus.PENDING_REVIEW,
        revision,
      },
      data: {
        revision: { increment: 1 },
        status: ArticleStatus.PUBLISHED,
        // An archived piece re-approved keeps the date the church first read it.
        publishedAt: article.publishedAt ?? now,
        reviewedAt: now,
        reviewedById: actor.profileId,
        reviewNote: note?.trim() || null,
      },
    });
    if (count === 0)
      throw new ConflictException(
        'This article is no longer waiting for review',
      );

    await this.notify(article.authorId, {
      title: 'Your article is published',
      body: note?.trim()
        ? `"${article.title}" is live for the church. ${note.trim()}`
        : `"${article.title}" is live for the church.`,
      link: `/dashboard/articles/${article.slug}`,
    });
    return { id, slug: article.slug, status: ArticleStatus.PUBLISHED };
  }

  async requestChanges(
    actor: AuthUser,
    id: string,
    revision: number,
    note: string,
  ) {
    await this.assertCanReview(actor);
    if (note.trim().length < 3)
      throw new BadRequestException(
        'Explain the changes the author should make',
      );
    const article = await this.pending(id);
    this.assertReviewable(actor, article, revision);

    const { count } = await this.prisma.memberArticle.updateMany({
      where: {
        id,
        tenantId: this.tenantId,
        status: ArticleStatus.PENDING_REVIEW,
        revision,
      },
      data: {
        revision: { increment: 1 },
        status: ArticleStatus.DRAFT,
        reviewedAt: new Date(),
        reviewedById: actor.profileId,
        reviewNote: note.trim(),
      },
    });
    if (count === 0)
      throw new ConflictException(
        'This article is no longer waiting for review',
      );

    await this.notify(article.authorId, {
      title: 'Your article needs a few changes',
      body: `"${article.title}": ${note.trim()}`,
      link: `/dashboard/articles/write?slug=${article.slug}`,
    });
    return { id, slug: article.slug, status: ArticleStatus.DRAFT };
  }

  /**
   * Tell the reviewers a piece is waiting.
   *
   * The content department's heads first. If that seat is empty, the pastors
   * and super admins, so a submission never lands in a queue nobody is told
   * about. The author is never notified about their own piece.
   */
  async notifyReviewers(article: { title: string; authorId: string }) {
    // Recipient lookup can fail too; submission must still succeed.
    try {
      const departmentId = await this.contentDepartmentId();
      let reviewerIds: string[] = [];

      if (departmentId) {
        const [heads, hods] = await Promise.all([
          this.prisma.departmentHead.findMany({
            where: {
              tenantId: this.tenantId,
              departmentId,
              endedAt: null,
              userId: { not: article.authorId },
            },
            select: { userId: true },
          }),
          this.prisma.departmentHod.findMany({
            where: {
              tenantId: this.tenantId,
              departmentId,
              endedAt: null,
              userId: { not: article.authorId },
            },
            select: { userId: true },
          }),
        ]);
        reviewerIds = [...heads, ...hods]
          .map((r) => r.userId)
          .filter((id) => id !== article.authorId);
      }

      if (reviewerIds.length === 0) {
        const grants = await this.prisma.roleGrant.findMany({
          where: {
            tenantId: this.tenantId,
            endedAt: null,
            role: { in: OVERSEEING_ROLES },
            userId: { not: article.authorId },
          },
          select: { userId: true },
        });
        reviewerIds = grants.map((g) => g.userId);
      }

      const recipients = Array.from(new Set(reviewerIds)).filter(
        (pid) => pid !== article.authorId,
      );
      // A lost notification must not fail the submission itself: the piece is in
      // the queue either way, and the review tab shows the count.
      await this.inbox.createMany(
        recipients.map((profileId) => ({
          tenantId: this.tenantId,
          profileId,
          type: 'article-review',
          title: 'An article is waiting for review',
          body: `"${article.title}"`,
          link: '/dashboard/articles/review',
        })),
      );
      return recipients.length;
    } catch (err) {
      this.logger.warn(
        `Reviewer notification failed: ${(err as Error).message}`,
      );
      return 0;
    }
  }

  private assertReviewable(
    actor: AuthUser,
    article: { authorId: string; revision: number },
    revision: number,
  ) {
    if (actor.profileId === article.authorId) {
      throw new ForbiddenException(
        'Another reviewer must approve your article',
      );
    }
    if (article.revision !== revision) {
      throw new ConflictException(
        'The author changed this article. Reload and read the latest version before reviewing.',
      );
    }
  }

  private async pending(id: string) {
    const article = await this.prisma.memberArticle.findFirst({
      where: { id, tenantId: this.tenantId },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        authorId: true,
        publishedAt: true,
        revision: true,
      },
    });
    if (!article) throw new NotFoundException('Article not found');
    if (article.status !== ArticleStatus.PENDING_REVIEW) {
      throw new ConflictException('This article is not waiting for review');
    }
    return article;
  }

  /**
   * A failed notification must not undo a review that already happened, so
   * it is logged rather than thrown.
   */
  private async notify(
    profileId: string,
    message: { title: string; body: string; link: string },
  ) {
    try {
      await this.inbox.createMany([
        {
          tenantId: this.tenantId,
          profileId,
          type: 'article-review',
          ...message,
        },
      ]);
    } catch (err) {
      this.logger.warn(
        `Review notification to ${profileId} failed: ${(err as Error).message}`,
      );
    }
  }
}
