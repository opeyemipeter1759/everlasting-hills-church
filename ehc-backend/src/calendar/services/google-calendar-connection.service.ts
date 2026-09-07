import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleTokenCipherService } from './google-token-cipher.service';

export interface GoogleCalendarTokens {
  accessToken: string;
  refreshToken: string | null;
  expiryDate: number;
  scope: string;
}

export interface GoogleCalendarConnectionStatus {
  connected: boolean;
  googleEmail: string | null;
  connectedAt: string | null;
}

/**
 * Prisma CRUD for `GoogleCalendarConnection`, keeping the encrypt/decrypt
 * boundary in one place so no other service ever handles a plaintext token.
 */
@Injectable()
export class GoogleCalendarConnectionService {
  private readonly logger = new Logger(GoogleCalendarConnectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: GoogleTokenCipherService,
  ) {}

  async findActive(userId: string, tenantId: string) {
    return this.prisma.googleCalendarConnection.findFirst({
      where: { userId, tenantId, revokedAt: null },
    });
  }

  /** Every currently-connected member, for the periodic sync job. */
  async listAllActive() {
    return this.prisma.googleCalendarConnection.findMany({
      where: { revokedAt: null },
      select: { userId: true, tenantId: true },
    });
  }

  async setCalendarId(connectionId: string, googleCalendarId: string): Promise<void> {
    await this.prisma.googleCalendarConnection.update({
      where: { id: connectionId },
      data: { googleCalendarId },
    });
  }

  async status(userId: string, tenantId: string): Promise<GoogleCalendarConnectionStatus> {
    const row = await this.findActive(userId, tenantId);
    return {
      connected: Boolean(row),
      googleEmail: row?.googleEmail ?? null,
      connectedAt: row?.connectedAt.toISOString() ?? null,
    };
  }

  /** Decrypted, ready to hand to the Google client. Null if never connected. */
  async getDecryptedTokens(userId: string, tenantId: string): Promise<GoogleCalendarTokens | null> {
    const row = await this.findActive(userId, tenantId);
    if (!row) return null;
    return {
      accessToken: this.cipher.decrypt(row.accessToken),
      refreshToken: row.refreshToken ? this.cipher.decrypt(row.refreshToken) : null,
      expiryDate: row.tokenExpiry.getTime(),
      scope: row.scope,
    };
  }

  /**
   * Upserts the active connection for this member. `refreshToken` is optional
   * because Google only returns one on the very first consent (or when
   * `prompt=consent` forces it) — a mid-life access-token-only refresh must
   * not overwrite the stored refresh token with nothing.
   */
  async save(
    userId: string,
    tenantId: string,
    googleEmail: string | null,
    tokens: { accessToken: string; refreshToken?: string | null; expiryDate: number; scope: string },
  ): Promise<void> {
    const existing = await this.findActive(userId, tenantId);

    const data = {
      googleEmail,
      accessToken: this.cipher.encrypt(tokens.accessToken),
      tokenExpiry: new Date(tokens.expiryDate),
      scope: tokens.scope,
      ...(tokens.refreshToken
        ? { refreshToken: this.cipher.encrypt(tokens.refreshToken) }
        : {}),
    };

    if (existing) {
      await this.prisma.googleCalendarConnection.update({ where: { id: existing.id }, data });
      return;
    }

    if (!tokens.refreshToken) {
      // Should not happen on a first connect (prompt=consent guarantees one),
      // but a connection with no refresh token can never renew itself.
      this.logger.warn(`New Google Calendar connection for user ${userId} arrived with no refresh token`);
    }

    await this.prisma.googleCalendarConnection.create({
      data: {
        id: randomUUID(),
        tenantId,
        userId,
        googleEmail,
        accessToken: this.cipher.encrypt(tokens.accessToken),
        refreshToken: this.cipher.encrypt(tokens.refreshToken ?? ''),
        tokenExpiry: new Date(tokens.expiryDate),
        scope: tokens.scope,
      },
    });
  }

  /** Persists a refreshed access token without disturbing the refresh token or connectedAt. */
  async updateAccessToken(userId: string, tenantId: string, accessToken: string, expiryDate: number): Promise<void> {
    const existing = await this.findActive(userId, tenantId);
    if (!existing) return;
    await this.prisma.googleCalendarConnection.update({
      where: { id: existing.id },
      data: { accessToken: this.cipher.encrypt(accessToken), tokenExpiry: new Date(expiryDate) },
    });
  }

  async revoke(userId: string, tenantId: string): Promise<void> {
    const existing = await this.findActive(userId, tenantId);
    if (!existing) throw new NotFoundException('No Google Calendar connection to disconnect');
    await this.prisma.googleCalendarConnection.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
  }
}
