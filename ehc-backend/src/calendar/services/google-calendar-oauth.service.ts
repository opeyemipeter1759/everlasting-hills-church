import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { Env } from '../../config/env.validation';

/**
 * Full read/write scope. This app both reads the member's own events (for the
 * in-app view) and writes church services/events/gatherings into a dedicated
 * secondary calendar it creates in their account — `calendar.events` alone
 * can't create that calendar, only manage events in ones that already exist,
 * so the broader scope is genuinely needed rather than requested by default.
 */
export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

/** State tokens are short-lived — just long enough for the Google consent redirect round trip. */
const STATE_TTL_MS = 10 * 60 * 1000;

interface StatePayload {
  userId: string;
  tenantId: string;
  nonce: string;
  exp: number;
}

/**
 * Wraps the Google OAuth2 client used to connect a member's personal
 * calendar. Deliberately separate from Supabase auth: this is a scoped,
 * revocable grant for one third-party API, not a sign-in method.
 *
 * `state` is what carries the member's identity through the redirect —
 * Google's callback is a plain browser navigation with no Authorization
 * header, so it's HMAC-signed here rather than trusted as-is, the same way a
 * webhook signature is verified elsewhere in this codebase.
 */
@Injectable()
export class GoogleCalendarOAuthService {
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly redirectUri?: string;
  private readonly stateSecret?: string;

  constructor(config: ConfigService<Env, true>) {
    this.clientId = config.get('GOOGLE_OAUTH_CLIENT_ID', { infer: true });
    this.clientSecret = config.get('GOOGLE_OAUTH_CLIENT_SECRET', { infer: true });
    this.redirectUri = config.get('GOOGLE_OAUTH_REDIRECT_URI', { infer: true });
    // The token encryption key doubles as the state-signing secret — both are
    // "a 32-byte secret only this server knows" and adding a second one buys
    // nothing.
    this.stateSecret = config.get('GOOGLE_TOKEN_ENCRYPTION_KEY', { infer: true });
  }

  get isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.redirectUri && this.stateSecret);
  }

  private requireConfigured(): void {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'Google Calendar sync is not configured on this server.',
      );
    }
  }

  createClient(): OAuth2Client {
    this.requireConfigured();
    return new google.auth.OAuth2(this.clientId, this.clientSecret, this.redirectUri);
  }

  buildConsentUrl(userId: string, tenantId: string): string {
    this.requireConfigured();
    const client = this.createClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      // Forces a refresh_token on every connect, not just the first —
      // otherwise a member who disconnects and reconnects gets none.
      prompt: 'consent',
      scope: [CALENDAR_SCOPE, 'https://www.googleapis.com/auth/userinfo.email'],
      state: this.signState(userId, tenantId),
    });
  }

  signState(userId: string, tenantId: string): string {
    const payload: StatePayload = {
      userId,
      tenantId,
      nonce: randomUUID(),
      exp: Date.now() + STATE_TTL_MS,
    };
    const json = JSON.stringify(payload);
    const body = Buffer.from(json, 'utf8').toString('base64url');
    const signature = this.sign(body);
    return `${body}.${signature}`;
  }

  verifyState(state: string): { userId: string; tenantId: string } {
    this.requireConfigured();
    const [body, signature] = state.split('.');
    if (!body || !signature) throw new UnauthorizedException('Invalid state');

    const expected = this.sign(body);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid state');
    }

    let payload: StatePayload;
    try {
      payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Invalid state');
    }

    if (payload.exp < Date.now()) {
      throw new UnauthorizedException('This connection link expired — please try again');
    }

    return { userId: payload.userId, tenantId: payload.tenantId };
  }

  private sign(body: string): string {
    return createHmac('sha256', this.stateSecret as string).update(body).digest('base64url');
  }
}
