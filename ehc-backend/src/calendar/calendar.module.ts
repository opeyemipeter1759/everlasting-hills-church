import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { GoogleCalendarController } from './google-calendar.controller';
import { CalendarEventService } from './services/calendar-event.service';
import { CalendarFeedService } from './services/calendar-feed.service';
import { CalendarTokenService } from './services/calendar-token.service';
import { GoogleCalendarConnectionService } from './services/google-calendar-connection.service';
import { GoogleCalendarEventsService } from './services/google-calendar-events.service';
import { GoogleCalendarOAuthService } from './services/google-calendar-oauth.service';
import { GoogleCalendarSyncService } from './services/google-calendar-sync.service';
import { GoogleTokenCipherService } from './services/google-token-cipher.service';
import { IcsBuilderService } from './services/ics-builder.service';

/**
 * Calendar: single-event .ics downloads, the per-member church-calendar
 * subscription feed, and (optionally) importing a member's own personal
 * Google Calendar for display alongside it.
 *
 * The .ics feed remains the primary way church events reach a member's
 * calendar app — it works for Google, Apple and Outlook from one endpoint,
 * with no OAuth consent screen or token storage. See PWA_NOTIFICATIONS_ARCHITECTURE.md.
 *
 * The Google OAuth pieces below (`GoogleCalendar*`) are a separate, opt-in
 * addition that goes both ways: `GoogleCalendarEventsService` reads the
 * member's own personal events into the in-app view, and
 * `GoogleCalendarSyncService` writes church services/events/gatherings into a
 * dedicated calendar it creates in their Google account (on connect, on a
 * manual "Sync now", and on a 6-hourly cron). They no-op with a 503 when
 * GOOGLE_OAUTH_* / GOOGLE_TOKEN_ENCRYPTION_KEY env vars are absent — see
 * env.validation.ts.
 */
@Module({
  controllers: [CalendarController, GoogleCalendarController],
  providers: [
    IcsBuilderService,
    CalendarEventService,
    CalendarFeedService,
    CalendarTokenService,
    GoogleTokenCipherService,
    GoogleCalendarOAuthService,
    GoogleCalendarConnectionService,
    GoogleCalendarEventsService,
    GoogleCalendarSyncService,
  ],
  exports: [CalendarTokenService, IcsBuilderService],
})
export class CalendarModule {}
