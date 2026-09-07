import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { Env } from '../../config/env.validation';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Encrypts Google OAuth tokens at rest with AES-256-GCM.
 *
 * These are live API credentials that can read a member's personal calendar
 * for as long as they're valid, unlike the .ics feed token which only ever
 * grants read access to what the church already publishes. A DB dump or
 * backup leak must not hand those over in plaintext.
 */
@Injectable()
export class GoogleTokenCipherService {
  private readonly logger = new Logger(GoogleTokenCipherService.name);
  private readonly key: Buffer | null;

  constructor(config: ConfigService<Env, true>) {
    const raw = config.get('GOOGLE_TOKEN_ENCRYPTION_KEY', { infer: true });
    if (!raw) {
      this.key = null;
      return;
    }
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      this.logger.error(
        'GOOGLE_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (base64). Google Calendar sync is disabled.',
      );
      this.key = null;
      return;
    }
    this.key = key;
  }

  get isConfigured(): boolean {
    return this.key !== null;
  }

  /** `iv.authTag.ciphertext`, each base64. */
  encrypt(plaintext: string): string {
    if (!this.key) {
      throw new InternalServerErrorException('Token encryption is not configured');
    }
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv, authTag, ciphertext].map((b) => b.toString('base64')).join('.');
  }

  decrypt(payload: string): string {
    if (!this.key) {
      throw new InternalServerErrorException('Token encryption is not configured');
    }
    const [ivB64, authTagB64, ciphertextB64] = payload.split('.');
    if (!ivB64 || !authTagB64 || !ciphertextB64) {
      throw new InternalServerErrorException('Malformed encrypted token');
    }
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
