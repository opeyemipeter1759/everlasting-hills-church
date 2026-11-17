import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import ws from 'ws';
import type { Env } from '../../config/env.validation';
import { PHOTO_BUCKET, PHOTO_READ_SECONDS } from './first-timer-photo.schema';

export interface SignedUpload {
  uploadUrl: string;
  /** Headers the browser must send with the upload. */
  headers: Record<string, string>;
}

/**
 * The private first-timer photo bucket, through the service-role key. Nothing
 * here is public: reads are short-lived signed links and uploads are one-time
 * signed links, so files never pass through Cloud Run.
 */
@Injectable()
export class FirstTimerPhotoStorage {
  private readonly logger = new Logger(FirstTimerPhotoStorage.name);
  private readonly url: string;
  private readonly key: string | undefined;
  private client: SupabaseClient | null = null;

  constructor(config: ConfigService<Env, true>) {
    this.url = config.get('SUPABASE_URL', { infer: true });
    this.key = config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true }) as string | undefined;
  }

  get configured(): boolean {
    return !!this.url && !!this.key;
  }

  /** A one-time upload link for exactly this key. It never overwrites an existing object. */
  async signUpload(key: string, contentType: string): Promise<SignedUpload> {
    const { data, error } = await this.bucket().createSignedUploadUrl(key);
    if (error || !data) throw this.failure('create an upload link', error);
    return {
      uploadUrl: data.signedUrl,
      // The two headers storage-js itself sends from a browser, so CORS is known to allow them.
      headers: { 'content-type': contentType, 'x-upsert': 'false' },
    };
  }

  async exists(key: string): Promise<boolean> {
    const bucket = this.bucket();
    try {
      const { data } = await bucket.exists(key);
      return data === true;
    } catch (err) {
      throw this.failure('check an upload', { message: err instanceof Error ? err.message : 'unknown error' });
    }
  }

  /** Removes objects; a failure is logged, never thrown, because a stray private file harms nobody. */
  async remove(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      const { error } = await this.bucket().remove(keys);
      if (error) this.logger.warn(`Could not remove ${keys.length} first-timer photo(s): ${error.message}`);
    } catch (err) {
      this.logger.warn(`Could not remove first-timer photo(s): ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  /** Short-lived read links for these keys, in one call. Keys that fail are left out. */
  async signReads(keys: string[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    if (keys.length === 0 || !this.configured) return out;
    try {
      const { data, error } = await this.bucket().createSignedUrls(keys, PHOTO_READ_SECONDS);
      if (error || !data) {
        this.logger.warn(`Could not sign first-timer photos: ${error?.message ?? 'no data'}`);
        return out;
      }
      for (const item of data) {
        if (item.path && item.signedUrl && !item.error) out.set(item.path, item.signedUrl);
      }
    } catch (err) {
      // A list still loads without photos; initials show instead.
      this.logger.warn(`Could not sign first-timer photos: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
    return out;
  }

  private bucket() {
    if (!this.configured) {
      throw new ServiceUnavailableException('Photo storage is not set up on this server yet');
    }
    if (!this.client) {
      this.client = createClient(this.url, this.key as string, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { transport: ws as unknown as WebSocketLikeConstructor },
      });
    }
    return this.client.storage.from(PHOTO_BUCKET);
  }

  private failure(what: string, error: { message: string } | null): ServiceUnavailableException {
    this.logger.error(`Could not ${what} for a first-timer photo: ${error?.message ?? 'no data'}`);
    return new ServiceUnavailableException('Photo storage is not answering. Try again in a minute.');
  }
}
