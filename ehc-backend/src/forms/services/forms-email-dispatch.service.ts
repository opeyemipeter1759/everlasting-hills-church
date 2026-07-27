import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvents, type SendEmailPayload } from '../../notifications/notification-events';
import type { Env } from '../../config/env.validation';

/**
 * Fire-and-forget email dispatch for public form intake. Never awaits — failures
 * are logged by NotificationsService.handleSendEmail. Returns synchronously so
 * form submissions aren't held up by Resend's latency or failures.
 */
@Injectable()
export class FormsEmailDispatchService {
  readonly adminEmail: string;
  readonly appUrl: string;

  constructor(
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.adminEmail =
      config.get('RESEND_ADMIN_EMAIL', { infer: true }) ??
      config.get('CONTACT_EMAIL', { infer: true }) ??
      'hello@everlastinghills.org';
    this.appUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ?? 'http://localhost:3000';
  }

  dispatch(payload: SendEmailPayload) {
    this.events.emit(NotificationEvents.SendEmail, payload);
  }
}
