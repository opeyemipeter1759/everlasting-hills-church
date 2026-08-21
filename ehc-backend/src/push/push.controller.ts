import { Body, Controller, Delete, Get, Patch, Post, ServiceUnavailableException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { parseSchema } from '../common/zod-parse.util';
import { subscribeSchema, unsubscribeSchema, updatePreferencesSchema } from './push.schemas';
import { PushDispatchService } from './services/push-dispatch.service';
import { PushSenderService } from './services/push-sender.service';
import { PushSubscriptionService } from './services/push-subscription.service';

/** Thin controller: validate with Zod, delegate to a service. */
@ApiTags('push')
@Controller('push')
@ApiBearerAuth('access-token')
export class PushController {
  constructor(
    private readonly subscriptions: PushSubscriptionService,
    private readonly sender: PushSenderService,
    private readonly dispatch: PushDispatchService,
  ) {}

  /**
   * The VAPID public key the browser needs before it can subscribe. Public
   * because it is public by definition, and the browser needs it before the
   * member has necessarily done anything else.
   */
  @Public()
  @Get('public-key')
  @ApiOperation({ summary: 'VAPID public key for browser subscription' })
  publicKey() {
    if (!this.sender.publicKey) {
      throw new ServiceUnavailableException('Push notifications are not configured');
    }
    return { publicKey: this.sender.publicKey };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Register this device for push notifications' })
  async subscribe(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.subscriptions.subscribe(actor, parseSchema(subscribeSchema, body));
  }

  @Delete('subscribe')
  @ApiOperation({ summary: 'Remove this device' })
  async unsubscribe(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    const { endpoint } = parseSchema(unsubscribeSchema, body);
    return this.subscriptions.unsubscribe(actor, endpoint);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'My notification preferences' })
  async getPreferences(@CurrentUser() actor: AuthUser) {
    return this.subscriptions.getPreferences(actor);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update my notification preferences' })
  async updatePreferences(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.subscriptions.updatePreferences(actor, parseSchema(updatePreferencesSchema, body));
  }

  /**
   * Sends a test notification to the caller's own devices.
   *
   * Throttled hard: it is the one endpoint that lets an authenticated user
   * trigger a push on demand, and without a limit it is a self-spam button.
   * Bypasses preference filtering on purpose, since the member is asking for
   * this one right now to check that it works.
   */
  @Post('test')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Send myself a test notification' })
  async test(@CurrentUser() actor: AuthUser) {
    if (!actor.profileId) {
      throw new ServiceUnavailableException('No profile is linked to this account');
    }
    if (!this.sender.isConfigured) {
      throw new ServiceUnavailableException('Push notifications are not configured');
    }

    const result = await this.dispatch.sendDirect(
      [actor.profileId],
      actor.tenantId,
      {
        title: 'Everlasting Hills Church',
        body: 'Notifications are working. This is what a reminder will look like.',
        url: '/dashboard/settings/notifications',
        tag: 'test-notification',
      },
    );

    return { sent: result.delivered, devices: result.attempted };
  }
}
