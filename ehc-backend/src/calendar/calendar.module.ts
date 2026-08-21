import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarEventService } from './services/calendar-event.service';
import { CalendarFeedService } from './services/calendar-feed.service';
import { CalendarTokenService } from './services/calendar-token.service';
import { IcsBuilderService } from './services/ics-builder.service';

/**
 * Calendar export: single-event .ics downloads and the per-member subscription
 * feed.
 *
 * Google Calendar OAuth is deliberately not built here. A subscription feed
 * covers the need — church events appear in the calendar the member already
 * uses — at a fraction of the maintenance cost: no OAuth consent screen, no
 * refresh-token storage or rotation, no per-provider API quotas, no re-consent
 * when scopes change, and it works for Apple Calendar and Outlook from the same
 * endpoint rather than needing one integration per provider. The tradeoff is
 * refresh latency (clients poll on their own schedule, typically hours), which
 * is acceptable for scheduled services and is precisely why urgent changes are
 * delivered by push instead. See PWA_NOTIFICATIONS_ARCHITECTURE.md.
 */
@Module({
  controllers: [CalendarController],
  providers: [
    IcsBuilderService,
    CalendarEventService,
    CalendarFeedService,
    CalendarTokenService,
  ],
  exports: [CalendarTokenService, IcsBuilderService],
})
export class CalendarModule {}
