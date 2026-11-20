import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { DocumentStorageNotReady } from './document-crypto';

/**
 * Where sealed counselling documents live: a private Google Cloud Storage
 * bucket of their own (COUNSELLING_DOCS_BUCKET), reached with the backend's own
 * service account, so access is plain IAM on that one bucket. Nothing here ever
 * makes a public or signed URL: files go in and out through the API only.
 *
 * Objects are only ever ciphertext, under random keys ({tenantId}/{uuid}).
 */
export abstract class DocumentStore {
  abstract get configured(): boolean;
  /** Stores a new object. Never overwrites one that exists. */
  abstract put(key: string, data: Buffer): Promise<void>;
  abstract get(key: string): Promise<Buffer>;
  /** Deletes an object. One that is already gone counts as deleted. */
  abstract remove(key: string): Promise<void>;
}

interface AuthClient {
  request<T>(o: {
    url: string;
    method: string;
    data?: Buffer;
    headers?: Record<string, string>;
    responseType?: 'arraybuffer' | 'json';
  }): Promise<{ data: T; status: number }>;
}

@Injectable()
export class GcsDocumentStore extends DocumentStore {
  private readonly logger = new Logger(GcsDocumentStore.name);
  private readonly bucket: string | undefined;
  private client: Promise<AuthClient> | null = null;

  constructor(config: ConfigService<Env, true>) {
    super();
    this.bucket = config.get('COUNSELLING_DOCS_BUCKET' as keyof Env, { infer: true }) as string | undefined;
  }

  get configured(): boolean {
    return !!this.bucket;
  }

  private auth(): Promise<AuthClient> {
    if (!this.bucket) throw new DocumentStorageNotReady();
    const { GoogleAuth } = require('google-auth-library') as typeof import('google-auth-library');
    this.client ??= new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/devstorage.read_write'] }).getClient() as unknown as Promise<AuthClient>;
    return this.client;
  }

  private object(key: string) {
    return `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(this.bucket!)}/o/${encodeURIComponent(key)}`;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const client = await this.auth();
    // ifGenerationMatch=0: refuse to replace an object that already exists.
    await client.request({
      url: `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(this.bucket!)}/o?uploadType=media&ifGenerationMatch=0&name=${encodeURIComponent(key)}`,
      method: 'POST',
      data,
      headers: { 'content-type': 'application/octet-stream' },
    });
  }

  async get(key: string): Promise<Buffer> {
    const client = await this.auth();
    const res = await client.request<ArrayBuffer>({ url: `${this.object(key)}?alt=media`, method: 'GET', responseType: 'arraybuffer' });
    return Buffer.from(res.data);
  }

  async remove(key: string): Promise<void> {
    const client = await this.auth();
    try {
      await client.request({ url: this.object(key), method: 'DELETE' });
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) return;
      this.logger.warn(`Could not delete a counselling document object (status ${status ?? 'unknown'})`);
      throw err;
    }
  }
}
