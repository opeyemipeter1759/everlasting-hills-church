import { Injectable } from '@nestjs/common';
import {
  decodeCursor,
  encodeCursor,
  FindPaginatedOptions,
  PaginatedSermons,
  SermonRecord,
  SermonRepository,
} from './sermon-repository';

/** Tenant used by the seed data — tests scope queries to this id. */
export const DEMO_TENANT = 'demo-tenant';

/**
 * Reference / test-double implementation of SermonRepository.
 *
 * Seeded deliberately mixed: one with no series, one with no description, one with a
 * real thumbnail, one audio-only, a couple of Latin placeholder titles, and dates
 * intentionally out of order in the array — so the date sort in the query is proven,
 * not inherited from source order.
 */
@Injectable()
export class InMemorySermonRepository implements SermonRepository {
  private readonly sermons: SermonRecord[] = [
    {
      id: 's-3',
      tenantId: DEMO_TENANT,
      slug: 'eternal-life',
      title: 'Eternal Life',
      speaker: 'Pastor Opeyemi Peter',
      preachedAt: '2026-05-24T09:00:00.000Z',
      series: 'The Gospel of John',
      description: 'What Jesus means when He speaks of life that does not end.',
      mediaType: 'both',
      audioUrl: 'https://cdn.example.com/sermons/eternal-life.mp3',
      videoUrl: 'https://youtube.com/watch?v=abc123',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80&auto=format&fit=crop',
      durationSeconds: 2940,
      published: true,
    },
    {
      id: 's-1',
      tenantId: DEMO_TENANT,
      slug: 'ratione-quia-dolor',
      title: 'Ratione quia dolor',
      speaker: 'Pastor John',
      preachedAt: '2026-04-12T09:00:00.000Z',
      series: null, // no series — badge row must still reserve height
      description: 'Consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
      mediaType: 'audio',
      audioUrl: 'https://cdn.example.com/sermons/ratione.mp3',
      videoUrl: null,
      thumbnailUrl: null,
      durationSeconds: 1980,
      published: true,
    },
    {
      id: 's-4',
      tenantId: DEMO_TENANT,
      slug: 'walking-by-the-spirit',
      title: 'Walking by the Spirit',
      speaker: 'Pastor Bowale Okunola',
      preachedAt: '2026-05-31T09:00:00.000Z',
      series: 'Galatians',
      description: null, // no description — CTA must still align via mt-auto
      mediaType: 'video',
      audioUrl: null,
      videoUrl: 'https://youtube.com/watch?v=def456',
      thumbnailUrl: null,
      durationSeconds: null,
      published: true,
    },
    {
      id: 's-2',
      tenantId: DEMO_TENANT,
      slug: 'lorem-ipsum-dolor',
      title: 'Lorem ipsum dolor sit',
      speaker: 'Pastor Grace',
      preachedAt: '2026-03-01T09:00:00.000Z',
      series: 'Foundations',
      description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
      mediaType: 'audio',
      audioUrl: 'https://cdn.example.com/sermons/lorem.mp3',
      videoUrl: null,
      thumbnailUrl: null,
      durationSeconds: 2400,
      published: true,
    },
    {
      id: 's-5-draft',
      tenantId: DEMO_TENANT,
      slug: 'unpublished-draft',
      title: 'Draft, must never appear',
      speaker: 'Pastor John',
      preachedAt: '2026-06-10T09:00:00.000Z',
      series: 'Drafts',
      description: 'Newer than everything, but unpublished.',
      mediaType: 'audio',
      published: false,
    },
  ];

  private sortedPublished(tenantId: string, series?: string | null): SermonRecord[] {
    return this.sermons
      .filter((s) => s.tenantId === tenantId && s.published)
      .filter((s) => (series ? s.series === series : true))
      .sort((a, b) => {
        const d = b.preachedAt.localeCompare(a.preachedAt);
        return d !== 0 ? d : b.id.localeCompare(a.id);
      });
  }

  async findRecent(tenantId: string, limit: number): Promise<SermonRecord[]> {
    return this.sortedPublished(tenantId).slice(0, limit);
  }

  async findPaginated(
    tenantId: string,
    { cursor, pageSize, series }: FindPaginatedOptions,
  ): Promise<PaginatedSermons> {
    let rows = this.sortedPublished(tenantId, series);

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        rows = rows.filter(
          (s) =>
            s.preachedAt < decoded.preachedAt ||
            (s.preachedAt === decoded.preachedAt && s.id < decoded.id),
        );
      }
    }

    const page = rows.slice(0, pageSize);
    const hasMore = rows.length > pageSize;
    const last = page[page.length - 1];
    return {
      items: page,
      nextCursor: hasMore && last ? encodeCursor(last.preachedAt, last.id) : null,
    };
  }
}
