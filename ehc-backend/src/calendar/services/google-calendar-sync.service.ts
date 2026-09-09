import { GoneException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { calendar_v3, google } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';
import { buildGatheringOccurrenceStart } from './recurrence.util';
import { CalendarFeedService, type MemberCalendarItem } from './calendar-feed.service';
import { GoogleCalendarConnectionService } from './google-calendar-connection.service';
import { GoogleCalendarOAuthService } from './google-calendar-oauth.service';

const DEDICATED_CALENDAR_NAME = 'Everlasting Hills Church';
const DEDICATED_CALENDAR_DESCRIPTION =
  'Services, events and gatherings from Everlasting Hills Church. Kept in sync automatically — edits made here may be overwritten.';

/** Google API errors carry `.code` (HTTP status) rather than throwing typed classes. */
function statusOf(err: unknown): number | undefined {
  return (err as { code?: number })?.code;
}

/**
 * Pushes church services, events and recurring gatherings into a dedicated
 * secondary calendar this app creates in the member's Google account — the
 * write-side counterpart to `GoogleCalendarEventsService` (which only reads).
 *
 * A dedicated calendar rather than the member's primary one, so: disconnecting
 * cleanly removes exactly what this app added, a member can hide/show church
 * items independently of their own, and a sync bug can never touch an event
 * the member created themselves.
 *
 * Idempotent by design: `GoogleCalendarSyncedEvent` maps each church item to
 * the Google event it produced, so re-running a sync updates existing events
 * instead of duplicating them. Recurring gatherings are pushed once as a
 * single Google recurring event (RRULE), not one row per occurrence.
 *
 * `scheduledSync` runs in every backend instance in the process — fine at
 * this app's scale (one small deployment), but a second instance would sync
 * everyone twice as often rather than duplicating data, since upserts here
 * are idempotent either way.
 */
@Injectable()
export class GoogleCalendarSyncService {
  private readonly logger = new Logger(GoogleCalendarSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connections: GoogleCalendarConnectionService,
    private readonly oauth: GoogleCalendarOAuthService,
    private readonly feed: CalendarFeedService,
  ) {}

  async syncForMember(userId: string, tenantId: string): Promise<{ synced: number; removed: number }> {
    const connection = await this.connections.findActive(userId, tenantId);
    const tokens = await this.connections.getDecryptedTokens(userId, tenantId);
    if (!connection || !tokens) {
      // Not an app-session problem — just this integration not being
      // connected. Must not be a 401: the frontend's global interceptor
      // treats any 401 from anywhere as "the login session is dead" and logs
      // the member out, which is exactly what disconnecting used to trigger
      // (this runs automatically on every calendar page visit while
      // connected — see the auto-sync effect in
      // ConnectPersonalGoogleCalendarCard.tsx).
      throw new NotFoundException('Google Calendar is not connected');
    }
    if (!tokens.refreshToken) {
      throw new ServiceUnavailableException(
        'Your Google Calendar connection is incomplete — please disconnect and reconnect.',
      );
    }

    const client = this.oauth.createClient();
    client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryDate,
    });
    client.on('tokens', (updated) => {
      if (!updated.access_token || !updated.expiry_date) return;
      this.connections
        .updateAccessToken(userId, tenantId, updated.access_token, updated.expiry_date)
        .catch((err: Error) => this.logger.warn(`Failed to persist refreshed Google token: ${err.message}`));
    });

    const calendarApi = google.calendar({ version: 'v3', auth: client });

    let calendarId: string;
    try {
      calendarId = await this.ensureCalendar(calendarApi, connection.id, connection.googleCalendarId);
    } catch (err) {
      this.throwIfAuthError(err);
      throw err;
    }

    const [items, gatherings] = await Promise.all([
      this.feed.getUpcomingForMemberById(userId, tenantId),
      this.prisma.recurringGathering.findMany({ where: { tenantId, isActive: true } }),
    ]);

    // Every item pushed concurrently rather than awaited one at a time — a
    // member watching their Google Calendar should see everything land
    // together, not trickle in over however many round trips there are items.
    // allSettled rather than all: one item choking (a transient Google error)
    // must not sink the rest of an otherwise-successful sync.
    const outcomes = await Promise.allSettled([
      ...items.map((item) => this.syncChurchItem(calendarApi, calendarId, connection.id, item)),
      ...gatherings.map((gathering) =>
        this.upsertEvent(
          calendarApi,
          calendarId,
          connection.id,
          `gathering-${gathering.id}`,
          this.buildGatheringBody(gathering),
        ).then(() => ({ synced: true, removed: false })),
      ),
    ]);

    let synced = 0;
    let removed = 0;
    let authFailed = false;

    for (const outcome of outcomes) {
      if (outcome.status === 'fulfilled') {
        if (outcome.value.removed) removed++;
        else if (outcome.value.synced) synced++;
        continue;
      }
      if (statusOf(outcome.reason) === 401 || statusOf(outcome.reason) === 403) {
        authFailed = true;
      } else {
        this.logger.warn(
          `Google Calendar item sync failed: ${(outcome.reason as Error)?.message ?? String(outcome.reason)}`,
        );
      }
    }

    if (authFailed) {
      throw new GoneException('Google Calendar access was revoked — please reconnect.');
    }

    return { synced, removed };
  }

  /** One church item: deletes it remotely if newly cancelled, otherwise upserts it. */
  private async syncChurchItem(
    calendarApi: calendar_v3.Calendar,
    calendarId: string,
    connectionId: string,
    item: MemberCalendarItem,
  ): Promise<{ synced: boolean; removed: boolean }> {
    const key = `${item.kind}-${item.id}`;
    if (item.cancelled) {
      const removed = await this.removeIfSynced(calendarApi, calendarId, connectionId, key);
      return { synced: false, removed };
    }
    await this.upsertEvent(calendarApi, calendarId, connectionId, key, this.buildItemBody(item));
    return { synced: true, removed: false };
  }

  /** Runs a sync for every connected member, swallowing per-member failures so one bad token never blocks the rest. */
  async syncAll(): Promise<{ members: number; failed: number }> {
    const connections = await this.connections.listAllActive();
    let failed = 0;
    for (const { userId, tenantId } of connections) {
      try {
        await this.syncForMember(userId, tenantId);
      } catch (err) {
        failed++;
        this.logger.warn(`Google Calendar sync failed for user ${userId}: ${(err as Error).message}`);
      }
    }
    return { members: connections.length, failed };
  }

  /**
   * Keeps every connection fresh without the member having to press "Sync
   * now" — this is what makes a newly-added church event eventually show up
   * on their Google Calendar on its own. Every 6 hours mirrors the .ics feed's
   * own advisory refresh interval (see FEED_TTL_SECONDS in calendar-feed.service.ts).
   */
  @Cron('0 */6 * * *', { name: 'google-calendar-sync' })
  async scheduledSync(): Promise<void> {
    try {
      const { members, failed } = await this.syncAll();
      if (members === 0) {
        this.logger.debug('No connected Google Calendars to sync');
        return;
      }
      this.logger.log(`Google Calendar sync: ${members - failed}/${members} members synced`);
    } catch (err) {
      this.logger.error(`Google Calendar sync job failed: ${(err as Error).message}`);
    }
  }

  private throwIfAuthError(err: unknown): void {
    const status = statusOf(err);
    if (status === 401 || status === 403) {
      throw new GoneException('Google Calendar access was revoked — please reconnect.');
    }
  }

  private async ensureCalendar(
    calendarApi: calendar_v3.Calendar,
    connectionId: string,
    existingCalendarId: string | null,
  ): Promise<string> {
    if (existingCalendarId) {
      try {
        await calendarApi.calendars.get({ calendarId: existingCalendarId });
        return existingCalendarId;
      } catch (err) {
        if (statusOf(err) !== 404) throw err;
        // Fell out of Google's side (member deleted it) — recreate below.
      }
    }

    const created = await calendarApi.calendars.insert({
      requestBody: { summary: DEDICATED_CALENDAR_NAME, description: DEDICATED_CALENDAR_DESCRIPTION },
    });
    const newCalendarId = created.data.id;
    if (!newCalendarId) throw new Error('Google did not return an id for the created calendar');

    await this.connections.setCalendarId(connectionId, newCalendarId);
    return newCalendarId;
  }

  private buildItemBody(item: MemberCalendarItem): calendar_v3.Schema$Event {
    return {
      summary: item.title,
      description: item.servingRoles?.length ? `You are serving as ${item.servingRoles.join(', ')}.` : undefined,
      location: item.location ?? undefined,
      start: { dateTime: item.start },
      end: { dateTime: item.end },
    };
  }

  private buildGatheringBody(gathering: {
    title: string;
    description: string | null;
    joinUrl: string | null;
    startDate: Date;
    startTime: string;
    timezone: string;
    durationMinutes: number;
    recurrenceRule: string;
  }): calendar_v3.Schema$Event {
    const start = buildGatheringOccurrenceStart(gathering.startDate, gathering.startTime, gathering.timezone);
    const end = new Date(start.getTime() + gathering.durationMinutes * 60_000);
    return {
      summary: gathering.title,
      description:
        [gathering.description, gathering.joinUrl ? `Join: ${gathering.joinUrl}` : null]
          .filter(Boolean)
          .join('\n\n') || undefined,
      location: gathering.joinUrl ?? undefined,
      start: { dateTime: start.toISOString(), timeZone: gathering.timezone },
      end: { dateTime: end.toISOString(), timeZone: gathering.timezone },
      recurrence: [`RRULE:${gathering.recurrenceRule}`],
    };
  }

  private async upsertEvent(
    calendarApi: calendar_v3.Calendar,
    calendarId: string,
    connectionId: string,
    itemKey: string,
    body: calendar_v3.Schema$Event,
  ): Promise<void> {
    const existing = await this.prisma.googleCalendarSyncedEvent.findUnique({
      where: { connectionId_itemKey: { connectionId, itemKey } },
    });

    if (existing) {
      try {
        await calendarApi.events.update({ calendarId, eventId: existing.googleEventId, requestBody: body });
        return;
      } catch (err) {
        const status = statusOf(err);
        if (status !== 404 && status !== 410) throw err;
        // The event vanished on Google's side — fall through and recreate it.
      }
    }

    const created = await calendarApi.events.insert({ calendarId, requestBody: body });
    const googleEventId = created.data.id;
    if (!googleEventId) return;

    await this.prisma.googleCalendarSyncedEvent.upsert({
      where: { connectionId_itemKey: { connectionId, itemKey } },
      create: { id: randomUUID(), connectionId, itemKey, googleEventId },
      update: { googleEventId },
    });
  }

  /** Returns whether a synced event actually existed and was removed. */
  private async removeIfSynced(
    calendarApi: calendar_v3.Calendar,
    calendarId: string,
    connectionId: string,
    itemKey: string,
  ): Promise<boolean> {
    const existing = await this.prisma.googleCalendarSyncedEvent.findUnique({
      where: { connectionId_itemKey: { connectionId, itemKey } },
    });
    if (!existing) return false;

    try {
      await calendarApi.events.delete({ calendarId, eventId: existing.googleEventId });
    } catch (err) {
      if (statusOf(err) !== 404 && statusOf(err) !== 410) throw err;
    }
    await this.prisma.googleCalendarSyncedEvent.delete({ where: { id: existing.id } }).catch(() => undefined);
    return true;
  }
}
