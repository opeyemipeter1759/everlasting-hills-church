import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { BookCollectionsService } from '../book-collections/book-collections.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

const COLLECTION_SELECT = { Collection: { select: { id: true, name: true } } } as const;

/**
 * The church's book library. Flat, not a "currently reading" pick — every
 * PUBLISHED book stays visible to members (via /books/feed) until unpublished
 * or deleted. Admins manage the full list (including drafts) via /books.
 */
@Injectable()
export class BooksService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly collections: BookCollectionsService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Admin list — every book regardless of status, newest first. */
  async list() {
    return this.prisma.book.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      include: COLLECTION_SELECT,
    });
  }

  /** Member feed — published books only. */
  async feed() {
    return this.prisma.book.findMany({
      where: { tenantId: this.tenantId, status: EventStatus.PUBLISHED },
      orderBy: { createdAt: 'desc' },
      include: COLLECTION_SELECT,
    });
  }

  /** Single book — admin can view any status, a member can only view a PUBLISHED one. */
  async findOne(id: string, opts: { allowDraft: boolean }) {
    const book = await this.prisma.book.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        ...(opts.allowDraft ? {} : { status: EventStatus.PUBLISHED }),
      },
      include: COLLECTION_SELECT,
    });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async create(dto: CreateBookDto, actorId?: string) {
    await this.collections.assertBelongsToTenant(dto.collectionId);
    return this.prisma.book.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        title: dto.title.trim(),
        author: dto.author?.trim() || null,
        description: dto.description?.trim() || null,
        coverUrl: dto.coverUrl?.trim() || null,
        fileUrl: dto.fileUrl.trim(),
        status: dto.status ?? EventStatus.PUBLISHED,
        collectionId: dto.collectionId,
        createdById: actorId ?? null,
      },
      include: COLLECTION_SELECT,
    });
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.findOne(id, { allowDraft: true });
    if (dto.collectionId !== undefined) await this.collections.assertBelongsToTenant(dto.collectionId);
    return this.prisma.book.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.author !== undefined && { author: dto.author.trim() || null }),
        ...(dto.description !== undefined && { description: dto.description.trim() || null }),
        ...(dto.coverUrl !== undefined && { coverUrl: dto.coverUrl.trim() || null }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl.trim() }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.collectionId !== undefined && { collectionId: dto.collectionId }),
      },
      include: COLLECTION_SELECT,
    });
  }

  async remove(id: string) {
    const result = await this.prisma.book.deleteMany({ where: { id, tenantId: this.tenantId } });
    if (result.count === 0) throw new NotFoundException('Book not found');
    return { id, deleted: true };
  }

  /** Flat comments on a book, oldest first — like a normal discussion thread. */
  async getComments(bookId: string) {
    return this.prisma.bookComment.findMany({
      where: { bookId, tenantId: this.tenantId },
      orderBy: { createdAt: 'asc' },
      include: { Member: { select: { firstName: true, lastName: true, photoUrl: true } } },
    });
  }

  async createComment(memberId: string, bookId: string, content: string) {
    await this.findOne(bookId, { allowDraft: false });
    return this.prisma.bookComment.create({
      data: { id: randomUUID(), tenantId: this.tenantId, bookId, memberId, content: content.trim() },
      include: { Member: { select: { firstName: true, lastName: true, photoUrl: true } } },
    });
  }

  /** Author or a PASTOR may delete a comment, same policy as SermonComment. */
  async deleteComment(commentId: string, requester: { memberId: string; isPastor: boolean }) {
    const comment = await this.prisma.bookComment.findFirst({
      where: { id: commentId, tenantId: this.tenantId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.memberId !== requester.memberId && !requester.isPastor) {
      throw new BadRequestException('You can only delete your own comments');
    }
    await this.prisma.bookComment.delete({ where: { id: commentId } });
    return { id: commentId, deleted: true };
  }
}
