import { Global, Module } from '@nestjs/common';
import { PushController } from './push.controller';
import { PushDispatchService } from './services/push-dispatch.service';
import { PushSenderService } from './services/push-sender.service';
import { PushSubscriptionService } from './services/push-subscription.service';
import { PushTriggersService } from './services/push-triggers.service';

/**
 * Web Push.
 *
 * Sits alongside the existing NotificationsModule (email via Resend) rather
 * than replacing it: they are separate channels with separate preferences, and
 * an email that arrives when a push does not is a feature, not a duplicate.
 * The structure mirrors NotificationsModule deliberately — @Global, event-driven
 * entry, swallow-and-log — so the two read the same way.
 *
 * @Global so any module can emit a push trigger without importing this one.
 */
@Global()
@Module({
  controllers: [PushController],
  providers: [
    PushSenderService,
    PushDispatchService,
    PushSubscriptionService,
    PushTriggersService,
  ],
  exports: [PushDispatchService, PushSubscriptionService],
})
export class PushModule {}
