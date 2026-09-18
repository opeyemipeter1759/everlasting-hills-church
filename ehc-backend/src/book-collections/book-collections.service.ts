import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { CreateBookCollectionDto } from './dto/create-book-collection.dto';
import { UpdateBookCollectionDto } from './dto/update-book-collection.dto';

/**
 * The shelves a book library is organized into — "Faith", "Power", "Healing".
 * A book belongs to at most one. Deleting a shelf never deletes its books
 * (Book.collectionId just falls back to null, i.e. uncategorized).
 */
@Injectable()
export class BookCollectionsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Admin list — every collection, with how many books sit under each. */
  async list() {
    return this.prisma.bookCollection.findMany({
      where: { tenantId: this.tenantId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { Book: true } } },
    });
  }

  /** Member feed — only collections that currently have a published book. */
  async feed() {
    return this.prisma.bookCollection.findMany({
      where: { tenantId: this.tenantId, Book: { some: { status: EventStatus.PUBLISHED } } },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    });
  }

  async create(dto: CreateBookCollectionDto) {
    const max = await this.prisma.bookCollection.aggregate({
      where: { tenantId: this.tenantId },
      _max: { order: true },
    });
    return this.prisma.bookCollection.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: dto.name.trim(),
        order: (max._max.order ?? -1) + 1,
      },
    });
  }

  async update(id: string, dto: UpdateBookCollectionDto) {
    await this.findOneOrThrow(id);
    return this.prisma.bookCollection.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  async remove(id: string) {
    const result = await this.prisma.bookCollection.deleteMany({ where: { id, tenantId: this.tenantId } });
    if (result.count === 0) throw new NotFoundException('Collection not found');
    return { id, deleted: true };
  }

  /** Used by BooksService to validate a collectionId belongs to this tenant before assigning it. */
  async assertBelongsToTenant(id: string) {
    const found = await this.prisma.bookCollection.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!found) throw new BadRequestException('Collection not found');
  }

  private async findOneOrThrow(id: string) {
    const found = await this.prisma.bookCollection.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!found) throw new NotFoundException('Collection not found');
    return found;
  }
}
