import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import type { Env } from '../../config/env.validation';
import type { PushPayload } from '../push.types';

export interface SendOutcome {
  ok: boolean;
  /** The push service says this endpoint is permanently gone (404 or 410). */
  gone: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * The web-push transport. Deliberately thin: one job, encrypt and POST a
 * payload to one endpoint, and classify the failure.
 *
 * Kept separate from PushDispatchService so the audience/preference logic can
 * be tested without a network, and so a future move to a queue only has to
 * change the caller.
 */
@Injectable()
export class PushSenderService {
  private readonly logger = new Logger(PushSenderService.name);
  readonly isConfigured: boolean;
  /** Public half of the VAPID keypair, handed to the browser to subscribe. */
  readonly publicKey: string | null;

  constructor(config: ConfigService<Env, true>) {
    const publicKey = config.get('VAPID_PUBLIC_KEY', { infer: true });
    const privateKey = config.get('VAPID_PRIVATE_KEY', { infer: true });
    const subject = config.get('VAPID_SUBJECT', { infer: true }) ?? 'mailto:info@everlastinghills.org';

    this.isConfigured = Boolean(publicKey && privateKey);
    this.publicKey = publicKey ?? null;

    if (this.isConfigured) {
      webpush.setVapidDetails(subject, publicKey!, privateKey!);
    } else {
      this.logger.warn('VAPID keys not set — push notifications disabled');
    }
  }

  async send(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: PushPayload,
  ): Promise<SendOutcome> {
    if (!this.isConfigured) {
      return { ok: false, gone: false, error: 'VAPID not configured' };
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify(payload),
        {
          TTL: 60 * 60, // drop rather than deliver a reminder an hour stale
          urgency: 'normal',
        },
      );
      return { ok: true, gone: false };
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;

      // 404 Not Found  — endpoint never existed or was garbage collected
      // 410 Gone       — the member unsubscribed in browser settings
      // Both are permanent. Anything else (429, 5xx, network) may recover.
      const gone = statusCode === 404 || statusCode === 410;

      if (!gone) {
        this.logger.debug(
          `push failed (${statusCode ?? 'network'}): ${(err as Error).message}`,
        );
      }

      return { ok: false, gone, statusCode, error: (err as Error).message };
    }
  }
}
