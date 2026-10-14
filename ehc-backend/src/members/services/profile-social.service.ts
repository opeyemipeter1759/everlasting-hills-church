import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { InboxService } from '../../inbox/inbox.service';

const COMMENTS_PAGE = 20;
const AUTHOR = { id: true, firstName: true, lastName: true, photoUrl: true } as const;
const fullName = (m: { firstName: string; lastName: string }) => `${m.firstName} ${m.lastName}`.trim();

/**
 * Likes and kind words ("write something nice about…") on member profiles. A member cannot like
 * or write on their own profile. The owner hears about each one in their
 * notifications; a comment can be removed by its writer, by the profile's
 * owner, or by a pastor or admin.
 */
@Injectable()
export class ProfileSocialService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private async owner(memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId: this.tenantId, status: MemberStatus.ACTIVE },
      select: { id: true, profileId: true, firstName: true, lastName: true },
    });
    if (!member) throw new NotFoundException('That member could not be found.');
    return member;
  }

  private async viewerName(viewerId: string) {
    const viewer = await this.prisma.member.findUnique({ where: { id: viewerId }, select: { firstName: true, lastName: true } });
    return viewer ? fullName(viewer) : 'A member';
  }

  async summary(memberId: string, viewerId: string | null) {
    const [likes, comments, mine] = await Promise.all([
      this.prisma.profileLike.count({ where: { memberId } }),
      this.prisma.profileComment.count({ where: { memberId } }),
      viewerId
        ? this.prisma.profileLike.findUnique({
            where: { memberId_likerMemberId: { memberId, likerMemberId: viewerId } },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);
    return { likeCount: likes, commentCount: comments, likedByMe: !!mine };
  }

  async like(memberId: string, viewerId: string) {
    if (memberId === viewerId) throw new BadRequestException('You cannot like your own profile.');
    const owner = await this.owner(memberId);
    const existing = await this.prisma.profileLike.findUnique({
      where: { memberId_likerMemberId: { memberId, likerMemberId: viewerId } },
      select: { id: true },
    });
    if (!existing) {
      await this.prisma.profileLike.create({
        data: { id: randomUUID(), tenantId: this.tenantId, memberId, likerMemberId: viewerId },
      });
      await this.inbox.createMany([
        {
          tenantId: this.tenantId,
          profileId: owner.profileId,
          title: `${await this.viewerName(viewerId)} liked your profile`,
          type: 'profile-like',
          link: `/dashboard/family/${viewerId}`,
        },
      ]);
    }
    return this.summary(memberId, viewerId);
  }

  async unlike(memberId: string, viewerId: string) {
    await this.prisma.profileLike.deleteMany({ where: { memberId, likerMemberId: viewerId } });
    return this.summary(memberId, viewerId);
  }

  async comments(memberId: string, page = 1) {
    const current = Math.max(1, Math.floor(page) || 1);
    const [total, rows] = await Promise.all([
      this.prisma.profileComment.count({ where: { memberId } }),
      this.prisma.profileComment.findMany({
        where: { memberId },
        orderBy: { createdAt: 'desc' },
        skip: (current - 1) * COMMENTS_PAGE,
        take: COMMENTS_PAGE,
        select: { id: true, body: true, createdAt: true, Author: { select: AUTHOR } },
      }),
    ]);
    return {
      items: rows.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        author: { id: c.Author.id, name: fullName(c.Author), photoUrl: c.Author.photoUrl },
      })),
      total,
      page: current,
      pageSize: COMMENTS_PAGE,
    };
  }

  async comment(memberId: string, viewerId: string, body: string) {
    if (memberId === viewerId) throw new BadRequestException('Write something nice about someone else.');
    const text = body.trim();
    if (!text) throw new BadRequestException('Write something first.');
    const owner = await this.owner(memberId);
    const created = await this.prisma.profileComment.create({
      data: { id: randomUUID(), tenantId: this.tenantId, memberId, authorMemberId: viewerId, body: text },
      select: { id: true },
    });
    await this.inbox.createMany([
      {
        tenantId: this.tenantId,
        profileId: owner.profileId,
        title: `${await this.viewerName(viewerId)} wrote something nice about you`,
        body: text.length > 120 ? `${text.slice(0, 117)}…` : text,
        type: 'profile-comment',
        link: `/dashboard/family/${memberId}#kind-words`,
      },
    ]);
    return created;
  }

  async deleteComment(memberId: string, commentId: string, viewerId: string | null, isStaff: boolean) {
    const comment = await this.prisma.profileComment.findFirst({
      where: { id: commentId, memberId },
      select: { id: true, authorMemberId: true, memberId: true },
    });
    if (!comment) throw new NotFoundException('That comment is gone already.');
    const allowed = isStaff || (viewerId && (viewerId === comment.authorMemberId || viewerId === comment.memberId));
    if (!allowed) throw new ForbiddenException('Only the writer or the profile’s owner can remove this.');
    await this.prisma.profileComment.delete({ where: { id: comment.id } });
    return { ok: true };
  }
}
