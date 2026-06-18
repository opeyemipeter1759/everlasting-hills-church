/**
 * Repository seam for the sermon read path.
 *
 * Controller and service depend on this interface via the SERMON_REPOSITORY token,
 * never on a concrete data source. Swap Prisma ⇆ in-memory ⇆ TypeORM without touching
 * callers. Sorting, limiting and cursoring live here (the query), never in the caller.
 */
export type MediaType = 'audio' | 'video' | 'both';

/** Internal entity shape. Mapped to SermonResponseDto before leaving the service. */
export interface SermonRecord {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  speaker: string;
  preachedAt: string; // ISO date
  series?: string | null;
  description?: string | null;
  mediaType: MediaType;
  audioUrl?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  published: boolean;
}

export interface FindPaginatedOptions {
  cursor?: string | null;
  pageSize: number;
  series?: string | null;
}

export interface PaginatedSermons {
  items: SermonRecord[];
  nextCursor: string | null;
}

export interface SermonRepository {
  /** Published sermons, newest first, capped at `limit`. */
  findRecent(tenantId: string, limit: number): Promise<SermonRecord[]>;
  /** Keyset-paginated published sermons, newest first. O(pageSize) at any depth. */
  findPaginated(tenantId: string, opts: FindPaginatedOptions): Promise<PaginatedSermons>;
}

export const SERMON_REPOSITORY = Symbol('SERMON_REPOSITORY');

/** Derive media kind from which URLs exist. */
export function deriveMediaType(audioUrl?: string | null, videoUrl?: string | null): MediaType {
  if (audioUrl && videoUrl) return 'both';
  if (videoUrl) return 'video';
  return 'audio';
}

/** Opaque keyset cursor: base64("<preachedAt>|<id>"). */
export function encodeCursor(preachedAt: string, id: string): string {
  return Buffer.from(`${preachedAt}|${id}`, 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): { preachedAt: string; id: string } | null {
  try {
    const [preachedAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    if (!preachedAt || !id) return null;
    return { preachedAt, id };
  } catch {
    return null;
  }
}
