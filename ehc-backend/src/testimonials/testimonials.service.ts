import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';

/**
 * Testimonials for the homepage slider — both admin-authored and visitor-submitted.
 *
 * Visitor submissions (POST /forms/testimony) land here unpublished via
 * FormsService.submitTestimony, so they show up as drafts on the pastor's testimonials
 * page for review before `published` is flipped to true.
 *
 * Tenant scope applied everywhere — same defense-in-depth as the sermons module.
 */
@Injectable()
export class TestimonialsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Public: only published testimonials, ordered by `order` asc then publishedAt desc. */
  async listPublished(limit = 20) {
    return this.prisma.testimonial.findMany({
      where: { tenantId: this.tenantId, published: true },
      orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        authorName: true,
        authorRole: true,
        authorPhotoUrl: true,
        content: true,
        publishedAt: true,
      },
    });
  }

  /** Admin: all testimonials including drafts. */
  async listAll() {
    return this.prisma.testimonial.findMany({
      where: { tenantId: this.tenantId },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getById(id: string) {
    const t = await this.prisma.testimonial.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!t) throw new NotFoundException('Testimonial not found');
    return t;
  }

  async create(data: CreateTestimonialDto) {
    const now = new Date();
    const published = data.published ?? false;
    return this.prisma.testimonial.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        authorName: data.authorName,
        authorRole: data.authorRole ?? null,
        authorPhotoUrl: data.authorPhotoUrl ?? null,
        content: data.content,
        published,
        publishedAt: published ? now : null,
        order: data.order ?? 0,
        updatedAt: now,
      },
    });
  }

  async update(id: string, data: UpdateTestimonialDto) {
    const current = await this.getById(id); // throws 404 if foreign
    const nowPublishing = data.published === true && !current.published;

    return this.prisma.testimonial.update({
      where: { id },
      data: {
        ...(data.authorName !== undefined && { authorName: data.authorName }),
        ...(data.authorRole !== undefined && { authorRole: data.authorRole }),
        ...(data.authorPhotoUrl !== undefined && { authorPhotoUrl: data.authorPhotoUrl }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.published !== undefined && { published: data.published }),
        ...(data.order !== undefined && { order: data.order }),
        ...(nowPublishing && { publishedAt: new Date() }),
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    const result = await this.prisma.testimonial.deleteMany({
      where: { id, tenantId: this.tenantId },
    });
    if (result.count === 0) throw new NotFoundException('Testimonial not found');
    return { id, deleted: true };
  }
}
