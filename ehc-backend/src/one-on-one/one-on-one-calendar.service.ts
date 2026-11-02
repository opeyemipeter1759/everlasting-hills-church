import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, type calendar_v3 } from 'googleapis';
import { randomUUID } from 'crypto';
import type { Env } from '../config/env.validation';
import { GoogleCalendarConnectionService } from '../calendar/services/google-calendar-connection.service';
import { GoogleCalendarOAuthService } from '../calendar/services/google-calendar-oauth.service';
import type { BusyInterval } from './slot-engine';

/** Free/busy answers are reused briefly so a month view doesn't call Google once per day. */
const BUSY_CACHE_MS = 2 * 60_000;

export interface CalendarEventInput {
  hostProfileId: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  attendeeEmail: string;
  withMeet: boolean;
}

/**
 * The pastor's own Google Calendar, through the connection they already make
 * on the Calendar page: busy times hide openings, and approved sessions are
 * written in. Everything here degrades quietly — a pastor who hasn't
 * connected, or a Google outage, must never block a request or a decision.
 */
@Injectable()
export class OneOnOneCalendarService {
  private readonly logger = new Logger(OneOnOneCalendarService.name);
  private readonly tenantId: string;
  private readonly busyCache = new Map<string, { at: number; busy: BusyInterval[] }>();

  constructor(
    private readonly connections: GoogleCalendarConnectionService,
    private readonly oauth: GoogleCalendarOAuthService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private async client(profileId: string): Promise<calendar_v3.Calendar | null> {
    const tokens = await this.connections.getDecryptedTokens(profileId, this.tenantId).catch(() => null);
    if (!tokens?.refreshToken) return null;
    const auth = this.oauth.createClient();
    auth.setCredentials({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken, expiry_date: tokens.expiryDate });
    auth.on('tokens', (t) => {
      if (!t.access_token || !t.expiry_date) return;
      this.connections
        .updateAccessToken(profileId, this.tenantId, t.access_token, t.expiry_date)
        .catch((err: Error) => this.logger.warn(`Couldn't persist refreshed Google token: ${err.message}`));
    });
    return google.calendar({ version: 'v3', auth });
  }

  async isConnected(profileId: string): Promise<boolean> {
    const status = await this.connections.status(profileId, this.tenantId).catch(() => null);
    return Boolean(status?.connected);
  }

  /** Busy times on the pastor's primary calendar between two instants. Empty when not connected. */
  async busy(profileId: string, from: Date, to: Date): Promise<BusyInterval[]> {
    const key = `${profileId}:${from.toISOString()}:${to.toISOString()}`;
    const cached = this.busyCache.get(key);
    if (cached && Date.now() - cached.at < BUSY_CACHE_MS) return cached.busy;

    const calendar = await this.client(profileId);
    if (!calendar) return [];
    try {
      const res = await calendar.freebusy.query({
        requestBody: { timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: 'primary' }] },
      });
      const busy = (res.data.calendars?.primary?.busy ?? [])
        .filter((b) => b.start && b.end)
        .map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }));
      this.busyCache.set(key, { at: Date.now(), busy });
      return busy;
    } catch (err) {
      this.logger.warn(`Google free/busy failed for ${profileId}: ${(err as Error).message}`);
      return [];
    }
  }

  /** Writes an approved session into the pastor's calendar, inviting the requester. */
  async createEvent(input: CalendarEventInput): Promise<{ eventId: string; meetLink: string | null } | null> {
    const calendar = await this.client(input.hostProfileId);
    if (!calendar) return null;
    try {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        sendUpdates: 'all',
        conferenceDataVersion: input.withMeet ? 1 : 0,
        requestBody: {
          summary: input.summary,
          description: input.description,
          start: { dateTime: input.start.toISOString(), timeZone: 'Africa/Lagos' },
          end: { dateTime: input.end.toISOString(), timeZone: 'Africa/Lagos' },
          attendees: [{ email: input.attendeeEmail }],
          reminders: { useDefault: true },
          ...(input.withMeet && {
            conferenceData: { createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
          }),
        },
      });
      this.invalidate(input.hostProfileId);
      return { eventId: res.data.id ?? '', meetLink: res.data.hangoutLink ?? null };
    } catch (err) {
      this.logger.warn(`Google event insert failed for ${input.hostProfileId}: ${(err as Error).message}`);
      return null;
    }
  }

  async deleteEvent(hostProfileId: string, eventId: string): Promise<void> {
    const calendar = await this.client(hostProfileId);
    if (!calendar) return;
    try {
      await calendar.events.delete({ calendarId: 'primary', eventId, sendUpdates: 'all' });
      this.invalidate(hostProfileId);
    } catch (err) {
      this.logger.warn(`Google event delete failed for ${hostProfileId}: ${(err as Error).message}`);
    }
  }

  private invalidate(profileId: string) {
    for (const key of this.busyCache.keys()) if (key.startsWith(`${profileId}:`)) this.busyCache.delete(key);
  }
}
