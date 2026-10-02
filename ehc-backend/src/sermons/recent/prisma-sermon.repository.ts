import { Injectable } from '@nestjs/common';
import { Prisma, SermonStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  decodeCursor,
  deriveMediaType,
  encodeCursor,
  FindPaginatedOptions,
  PaginatedSermons,
  SermonRecord,
  SermonRepository,
} from './sermon-repository';

type SermonRow = {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  speaker: string;
  date: Date;
  series: string | null;
  description: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  audioDuration: number | null;
  status: SermonStatus;
  Episodes: { url: string; duration: number }[];
};

const SELECT = {
  id: true,
  tenantId: true,
  slug: true,
  title: true,
  speaker: true,
  date: true,
  series: true,
  description: true,
  audioUrl: true,
  videoUrl: true,
  thumbnailUrl: true,
  audioDuration: true,
  status: true,
  // A series keeps its audio on its episodes: the first one plays from the card.
  Episodes: { select: { url: true, duration: true }, orderBy: { order: 'asc' } },
} satisfies Prisma.SermonSelect;

/**
 * Production SermonRepository over Prisma. Bound to SERMON_REPOSITORY in the module.
 *
 * Scale note: add a composite index `(tenantId, status, date desc, id desc)` so both
 * findRecent and the keyset findPaginated are index-only scans regardless of how many
 * sermons a tenant accumulates.
 */
@Injectable()
export class PrismaSermonRepository implements SermonRepository {
  constructor(private readonly prisma: PrismaService) {}

  private static toRecord(row: SermonRow): SermonRecord {
    const audioUrl = row.audioUrl ?? row.Episodes[0]?.url ?? null;
    const seriesSeconds = row.Episodes.reduce((sum, e) => sum + (e.duration || 0), 0);
    return {
      id: row.id,
      tenantId: row.tenantId,
      slug: row.slug,
      title: row.title,
      speaker: row.speaker,
      preachedAt: row.date.toISOString(),
      series: row.series,
      description: row.description,
      mediaType: deriveMediaType(audioUrl, row.videoUrl),
      audioUrl,
      videoUrl: row.videoUrl,
      thumbnailUrl: row.thumbnailUrl,
      durationSeconds: row.audioDuration ?? (seriesSeconds || null),
      published: row.status === SermonStatus.PUBLISHED,
    };
  }

  async findRecent(tenantId: string, limit: number): Promise<SermonRecord[]> {
    const rows = await this.prisma.sermon.findMany({
      where: { tenantId, status: SermonStatus.PUBLISHED },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: limit,
      select: SELECT,
    });
    return rows.map(PrismaSermonRepository.toRecord);
  }

  async findPaginated(
    tenantId: string,
    { cursor, pageSize, series }: FindPaginatedOptions,
  ): Promise<PaginatedSermons> {
    const where: Prisma.SermonWhereInput = {
      tenantId,
      status: SermonStatus.PUBLISHED,
      ...(series ? { OR: [{ series }, { seriesSlug: series }] } : {}),
    };

    // Keyset: everything strictly older than the cursor (date, id) tuple.
    const decoded = cursor ? decodeCursor(cursor) : null;
    if (decoded) {
      const cursorDate = new Date(decoded.preachedAt);
      where.AND = [
        {
          OR: [
            { date: { lt: cursorDate } },
            { date: cursorDate, id: { lt: decoded.id } },
          ],
        },
      ];
    }

    const rows = await this.prisma.sermon.findMany({
      where,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: pageSize + 1, // peek one ahead to know if there's a next page
      select: SELECT,
    });

    const hasMore = rows.length > pageSize;
    const items = rows.slice(0, pageSize).map(PrismaSermonRepository.toRecord);
    const last = items[items.length - 1];
    return {
      items,
      nextCursor: hasMore && last ? encodeCursor(last.preachedAt, last.id) : null,
    };
  }
}
