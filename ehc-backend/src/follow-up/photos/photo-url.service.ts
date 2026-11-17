import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { isPhotoKeyOf, isTenantPhotoKey } from './first-timer-photo.schema';
import { FirstTimerPhotoStorage } from './first-timer-photo-storage.service';

/**
 * Short-lived read links for first-timer photos, signed a page at a time.
 *
 * Callers pass only keys from rows their own tenant-scoped query returned,
 * and every key is checked again here against this tenant's folder, so a key
 * from another church can never be turned into a link.
 */
@Injectable()
export class PhotoUrlService {
  private readonly tenantId: string;

  constructor(
    private readonly storage: FirstTimerPhotoStorage,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** key to signed link, for the keys under this tenant. Anything else is skipped. */
  async signMany(keys: (string | null | undefined)[]): Promise<Map<string, string>> {
    const own = [...new Set(keys.filter((k): k is string => !!k && isTenantPhotoKey(k, this.tenantId)))];
    return this.storage.signReads(own);
  }

  /** The rows with `photoUrl` beside each `photoKey`: one signing call for the whole page. */
  async attach<T extends { visitorId: string; photoKey: string | null }>(rows: T[]): Promise<(T & { photoUrl: string | null })[]> {
    // A key must sit in that same person's folder, not just this tenant's.
    const keyOf = (r: T) => (r.photoKey && isPhotoKeyOf(r.photoKey, this.tenantId, r.visitorId) ? r.photoKey : null);
    const urls = await this.signMany(rows.map(keyOf));
    return rows.map((r) => {
      const key = keyOf(r);
      return { ...r, photoUrl: key ? (urls.get(key) ?? null) : null };
    });
  }
}
