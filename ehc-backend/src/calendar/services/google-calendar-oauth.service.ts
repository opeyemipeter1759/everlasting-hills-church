import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { Env } from '../../config/env.validation';
import { isAllowedOrigin } from '../../common/allowed-origins.util';

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
  /** The frontend origin to redirect back to once the callback finishes — the
   * caller's own Origin header at connect-time, not a static server config,
   * so this keeps working across previews/environments without redeploying
   * the backend. Validated against the same allowlist CORS trusts. */
  origin: string;
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
  /** Fallback redirect target when the connect request carried no (or an
   * untrusted) Origin header — keeps the flow working for non-browser callers
   * and old links, same as before this was origin-driven. */
  private readonly fallbackFrontendUrl: string;
  private readonly allowedOriginsConfig: { frontendUrl?: string; extraOrigins: string[]; allowVercelPreviews: boolean; isProd: boolean };

  constructor(config: ConfigService<Env, true>) {
    this.clientId = config.get('GOOGLE_OAUTH_CLIENT_ID', { infer: true });
    this.clientSecret = config.get('GOOGLE_OAUTH_CLIENT_SECRET', { infer: true });
    this.redirectUri = config.get('GOOGLE_OAUTH_REDIRECT_URI', { infer: true });
    // The token encryption key doubles as the state-signing secret — both are
    // "a 32-byte secret only this server knows" and adding a second one buys
    // nothing.
    this.stateSecret = config.get('GOOGLE_TOKEN_ENCRYPTION_KEY', { infer: true });

    const frontendUrl = config.get('FRONTEND_URL', { infer: true });
    this.fallbackFrontendUrl = (frontendUrl ?? 'http://localhost:3000').replace(/\/$/, '');
    this.allowedOriginsConfig = {
      frontendUrl,
      extraOrigins: (config.get('CORS_EXTRA_ORIGINS', { infer: true }) ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      allowVercelPreviews: config.get('CORS_ALLOW_VERCEL_PREVIEWS', { infer: true }) !== 'false',
      isProd: config.get('NODE_ENV', { infer: true }) === 'production',
    };
  }

  /** The origin to carry through the OAuth round trip — the caller's own
   * Origin header if it's one we already trust for CORS, otherwise the
   * static fallback. Never trusts an arbitrary caller-supplied origin. */
  resolveReturnOrigin(requestOrigin: string | undefined): string {
    if (requestOrigin && isAllowedOrigin(requestOrigin, this.allowedOriginsConfig)) {
      return requestOrigin.replace(/\/$/, '');
    }
    return this.fallbackFrontendUrl;
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

  buildConsentUrl(userId: string, tenantId: string, requestOrigin: string | undefined): string {
    this.requireConfigured();
    const client = this.createClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      // Forces a refresh_token on every connect, not just the first —
      // otherwise a member who disconnects and reconnects gets none.
      prompt: 'consent',
      scope: [CALENDAR_SCOPE, 'https://www.googleapis.com/auth/userinfo.email'],
      state: this.signState(userId, tenantId, this.resolveReturnOrigin(requestOrigin)),
    });
  }

  signState(userId: string, tenantId: string, origin: string): string {
    const payload: StatePayload = {
      userId,
      tenantId,
      origin,
      nonce: randomUUID(),
      exp: Date.now() + STATE_TTL_MS,
    };
    const json = JSON.stringify(payload);
    const body = Buffer.from(json, 'utf8').toString('base64url');
    const signature = this.sign(body);
    return `${body}.${signature}`;
  }

  verifyState(state: string): { userId: string; tenantId: string; origin: string } {
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

    // Older, pre-origin state tokens (signed before this field existed) would
    // decode with origin undefined — falling back keeps any in-flight link
    // from breaking across a deploy, at worst redirecting to the static URL.
    return { userId: payload.userId, tenantId: payload.tenantId, origin: payload.origin ?? this.fallbackFrontendUrl };
  }

  private sign(body: string): string {
    return createHmac('sha256', this.stateSecret as string).update(body).digest('base64url');
  }
}
