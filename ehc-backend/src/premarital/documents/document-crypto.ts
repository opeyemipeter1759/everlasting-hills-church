import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'crypto';
import type { Env } from '../../config/env.validation';

/**
 * Envelope encryption for counselling documents, on top of the storage
 * provider's own encryption at rest.
 *
 *   - every file gets its own random 256-bit data key and is sealed with
 *     AES-256-GCM: stored object = "EHCD1" | iv(12) | tag(16) | ciphertext
 *   - the data key is sealed with the master key (AES-256-GCM, the key version
 *     as associated data) and kept in the database row, never in storage
 *   - the master key comes from Secret Manager, mounted on Cloud Run as
 *     COUNSELLING_DOC_KEK_V<n>; COUNSELLING_DOC_KEK_CURRENT says which version
 *     new files use. Older versions stay mounted while files still use them.
 *
 * The upload page's code pepper and session signing key are derived from the
 * current master key (HKDF), so there is one secret to look after.
 *
 * Without a master key nothing is stored: uploads and views answer 503.
 */
const MAGIC = Buffer.from('EHCD1');
const IV = 12;
const TAG = 16;
export const MAX_KEY_VERSION = 3;

export class DocumentStorageNotReady extends ServiceUnavailableException {
  constructor() {
    super('Secure document storage is not set up on this server yet. Please bring your documents to the church office for now.');
  }
}

@Injectable()
export class DocumentCrypto {
  private readonly logger = new Logger(DocumentCrypto.name);
  private readonly keys = new Map<number, Buffer>();
  private readonly current: number | null;

  constructor(config: ConfigService<Env, true>) {
    for (let v = 1; v <= MAX_KEY_VERSION; v++) {
      const raw = config.get(`COUNSELLING_DOC_KEK_V${v}` as keyof Env, { infer: true }) as string | undefined;
      if (!raw) continue;
      const key = Buffer.from(raw, 'base64');
      if (key.length === 32) this.keys.set(v, key);
      else this.logger.error(`COUNSELLING_DOC_KEK_V${v} must decode to exactly 32 bytes; it is ignored.`);
    }
    const wanted = Number(config.get('COUNSELLING_DOC_KEK_CURRENT' as keyof Env, { infer: true }) ?? 1);
    this.current = this.keys.has(wanted) ? wanted : null;
    if (this.keys.size && this.current === null)
      this.logger.error('COUNSELLING_DOC_KEK_CURRENT names a key version that is not mounted; document storage is off.');
  }

  get configured(): boolean {
    return this.current !== null;
  }

  get currentVersion(): number {
    if (this.current === null) throw new DocumentStorageNotReady();
    return this.current;
  }

  private kek(version: number): Buffer {
    const key = this.keys.get(version);
    if (!key) throw new DocumentStorageNotReady();
    return key;
  }

  encrypt(plain: Buffer): { blob: Buffer; wrappedKey: Buffer; keyVersion: number } {
    const keyVersion = this.currentVersion;
    const dataKey = randomBytes(32);
    try {
      const iv = randomBytes(IV);
      const cipher = createCipheriv('aes-256-gcm', dataKey, iv);
      const body = Buffer.concat([cipher.update(plain), cipher.final()]);
      const blob = Buffer.concat([MAGIC, iv, cipher.getAuthTag(), body]);
      return { blob, wrappedKey: this.wrap(dataKey, keyVersion), keyVersion };
    } finally {
      dataKey.fill(0);
    }
  }

  decrypt(blob: Buffer, wrappedKey: Buffer, keyVersion: number): Buffer {
    if (blob.length < MAGIC.length + IV + TAG || !blob.subarray(0, MAGIC.length).equals(MAGIC))
      throw new Error('Not a sealed counselling document');
    const dataKey = this.unwrap(wrappedKey, keyVersion);
    try {
      const at = MAGIC.length;
      const decipher = createDecipheriv('aes-256-gcm', dataKey, blob.subarray(at, at + IV));
      decipher.setAuthTag(blob.subarray(at + IV, at + IV + TAG));
      return Buffer.concat([decipher.update(blob.subarray(at + IV + TAG)), decipher.final()]);
    } finally {
      dataKey.fill(0);
    }
  }

  /** A key derived from the current master key for one purpose (code pepper, session signing). */
  derive(purpose: 'otp-pepper' | 'couple-session'): Buffer {
    const key = this.kek(this.currentVersion);
    return Buffer.from(hkdfSync('sha256', key, Buffer.alloc(0), `ehc-counselling-${purpose}`, 32));
  }

  private wrap(dataKey: Buffer, version: number): Buffer {
    const iv = randomBytes(IV);
    const cipher = createCipheriv('aes-256-gcm', this.kek(version), iv);
    cipher.setAAD(Buffer.from(`ehc-dek-v${version}`));
    const body = Buffer.concat([cipher.update(dataKey), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), body]);
  }

  private unwrap(wrapped: Buffer, version: number): Buffer {
    const decipher = createDecipheriv('aes-256-gcm', this.kek(version), wrapped.subarray(0, IV));
    decipher.setAAD(Buffer.from(`ehc-dek-v${version}`));
    decipher.setAuthTag(wrapped.subarray(IV, IV + TAG));
    return Buffer.concat([decipher.update(wrapped.subarray(IV + TAG)), decipher.final()]);
  }
}
