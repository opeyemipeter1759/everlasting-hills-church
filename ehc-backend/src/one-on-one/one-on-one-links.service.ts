import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Env } from '../config/env.validation';

/**
 * A visitor has no account, so their request is reached through a private
 * link: `<bookingId>.<signature>`. The signature is an HMAC of the booking id,
 * so every later email can include the same link without the token ever being
 * stored. Keyed off CMS_PREVIEW_SECRET (always set) with its own domain
 * label; rotating that secret invalidates outstanding visitor links.
 */
@Injectable()
export class OneOnOneLinksService {
  private readonly secret: string;
  private readonly appUrl: string;

  constructor(config: ConfigService<Env, true>) {
    this.secret = config.get('CMS_PREVIEW_SECRET', { infer: true });
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) ?? 'https://www.everlastinghills.church').replace(/\/$/, '');
  }

  private sign(bookingId: string): string {
    return createHmac('sha256', this.secret).update(`one-on-one-visitor:${bookingId}`).digest('base64url');
  }

  tokenFor(bookingId: string): string {
    return `${bookingId}.${this.sign(bookingId)}`;
  }

  /** The booking id a token was issued for, or null if it was tampered with. */
  bookingIdFrom(token: string): string | null {
    const dot = token.lastIndexOf('.');
    if (dot <= 0) return null;
    const id = token.slice(0, dot);
    const given = Buffer.from(token.slice(dot + 1));
    const expected = Buffer.from(this.sign(id));
    return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
  }

  visitorUrl(bookingId: string): string {
    return `${this.appUrl}/talk-to-a-pastor/request/${this.tokenFor(bookingId)}`;
  }

  get memberUrl(): string {
    return `${this.appUrl}/dashboard/one-on-one`;
  }

  get manageUrl(): string {
    return `${this.appUrl}/dashboard/one-on-one/manage`;
  }

  get siteUrl(): string {
    return this.appUrl;
  }
}
