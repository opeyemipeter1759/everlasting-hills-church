import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Resend } from 'resend';
import type { Env } from '../config/env.validation';
import { NotificationEvents, type SendEmailPayload } from './notification-events';

/**
 * Email dispatcher. Runs out-of-band via @OnEvent — callers fire-and-forget.
 *
 * When BullMQ ships, replace @OnEvent with @Processor + the same business logic.
 * Failures are logged but never propagate back to the original request.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly fromAddress: string;
  private resend?: Resend;

  constructor(config: ConfigService<Env, true>) {
    this.fromAddress = `Everlasting Hills <${config.get('RESEND_FROM', { infer: true }) ?? 'onboarding@resend.dev'}>`;
    const apiKey = config.get('RESEND_API_KEY', { infer: true });
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not set — email sending disabled');
    }
  }

  /**
   * In-process delivery path. Fired by EventEmitter when no Redis queue is
   * configured. Swallows failures (logged, never thrown) so it can never break
   * the request that triggered it.
   */
  @OnEvent(NotificationEvents.SendEmail, { async: true, promisify: true })
  async handleSendEmail(payload: SendEmailPayload) {
    try {
      await this.deliver(payload);
    } catch (err) {
      this.logger.error(
        `[${payload.tag}] email failed → ${payload.to}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Actually send the email via Resend. Shared by both the in-process
   * EventEmitter handler and the BullMQ queue processor.
   *
   * When invoked from the queue we WANT failures to throw, so BullMQ can retry.
   * The EventEmitter handler awaits this too but its surrounding wrapper treats
   * a rejection as fire-and-forget.
   */
  async deliver(payload: SendEmailPayload): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `[${payload.tag}] dropped email to ${payload.to} — Resend not configured`,
      );
      return;
    }
    await this.resend.emails.send({
      from: this.fromAddress,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      ...(payload.html ? { html: payload.html } : {}),
    });
    this.logger.debug(`[${payload.tag}] email sent → ${payload.to}`);
  }
}
