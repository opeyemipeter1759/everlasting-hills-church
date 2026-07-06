import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

@Injectable()
export class CommunityService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getFeed() {
    const posts = await this.prisma.communityPost.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        Profile: {
          include: {
            Member: { select: { firstName: true, lastName: true, photoUrl: true } },
          },
        },
      },
    });

    return posts.map((p) => ({
      id: p.id,
      text: p.text,
      reactions: p.reactions,
      createdAt: p.createdAt,
      authorName: p.Profile.Member
        ? `${p.Profile.Member.firstName} ${p.Profile.Member.lastName}`.trim()
        : 'Church Member',
      authorPhotoUrl: p.Profile.Member?.photoUrl ?? null,
    }));
  }

  async createPost(profileId: string, text: string) {
    return this.prisma.communityPost.create({
      data: { id: randomUUID(), tenantId: this.tenantId, profileId, text },
    });
  }

  async react(id: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post || post.tenantId !== this.tenantId) throw new NotFoundException();
    return this.prisma.communityPost.update({
      where: { id },
      data: { reactions: { increment: 1 } },
    });
  }
}
