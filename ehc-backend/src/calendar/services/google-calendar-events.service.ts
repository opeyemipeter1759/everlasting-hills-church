import { GoneException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleCalendarConnectionService } from './google-calendar-connection.service';
import { GoogleCalendarOAuthService } from './google-calendar-oauth.service';

/** Same rolling window the church-calendar JSON endpoint uses, for a consistent "what's coming up" range. */
const WINDOW_FUTURE_DAYS = 180;

export interface PersonalCalendarEvent {
  id: string;
  title: string;
  /** ISO 8601 */
  start: string;
  /** ISO 8601 */
  end: string;
  allDay: boolean;
  location: string | null;
  /** Link to open the event in Google Calendar. */
  htmlLink: string | null;
}

/**
 * Reads events off the member's own primary Google Calendar, once they've
 * connected it. Read-only — this app never writes to a member's calendar.
 */
@Injectable()
export class GoogleCalendarEventsService {
  private readonly logger = new Logger(GoogleCalendarEventsService.name);

  constructor(
    private readonly connections: GoogleCalendarConnectionService,
    private readonly oauth: GoogleCalendarOAuthService,
  ) {}

  async listUpcoming(userId: string, tenantId: string): Promise<PersonalCalendarEvent[]> {
    const tokens = await this.connections.getDecryptedTokens(userId, tenantId);
    if (!tokens) {
      // Not the caller's *app* session being invalid — just this one
      // integration not being connected. 401 here would tell the frontend's
      // global interceptor to nuke the real login session, which is wrong:
      // it already happened once, when disconnecting raced this endpoint's
      // refetch against the connection actually being revoked.
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

    // Fires whenever the library refreshes the access token on our behalf —
    // persist it so the next request doesn't need to refresh again.
    client.on('tokens', (updated) => {
      if (!updated.access_token || !updated.expiry_date) return;
      this.connections
        .updateAccessToken(userId, tenantId, updated.access_token, updated.expiry_date)
        .catch((err: Error) =>
          this.logger.warn(`Failed to persist refreshed Google token: ${err.message}`),
        );
    });

    const calendar = google.calendar({ version: 'v3', auth: client });
    const now = new Date();
    const to = new Date(now.getTime() + WINDOW_FUTURE_DAYS * 86_400_000);

    let res;
    try {
      res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: to.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100,
      });
    } catch (err) {
      const status = (err as { code?: number }).code;
      if (status === 401 || status === 403) {
        // Same reasoning as above: this is Google's grant being stale, not
        // this app's own session — must not be a 401 the frontend's
        // interceptor could mistake for that.
        throw new GoneException('Google Calendar access was revoked — please reconnect.');
      }
      this.logger.error(`Google Calendar events.list failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Could not reach Google Calendar. Please try again later.');
    }

    return (res.data.items ?? [])
      .filter((event) => event.status !== 'cancelled')
      .map((event) => {
        const allDay = Boolean(event.start?.date && !event.start?.dateTime);
        const start = event.start?.dateTime ?? event.start?.date;
        const end = event.end?.dateTime ?? event.end?.date;
        return {
          id: event.id ?? '',
          title: event.summary ?? '(untitled)',
          start: start ? new Date(start).toISOString() : now.toISOString(),
          end: end ? new Date(end).toISOString() : now.toISOString(),
          allDay,
          location: event.location ?? null,
          htmlLink: event.htmlLink ?? null,
        };
      })
      .filter((event) => event.id);
  }
}
