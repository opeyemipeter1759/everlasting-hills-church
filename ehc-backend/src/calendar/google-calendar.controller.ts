import { Controller, Get, Headers, Logger, Post, Query, Res, ServiceUnavailableException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { google } from 'googleapis';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { GoogleCalendarConnectionService } from './services/google-calendar-connection.service';
import { GoogleCalendarEventsService } from './services/google-calendar-events.service';
import { GoogleCalendarOAuthService } from './services/google-calendar-oauth.service';
import { GoogleCalendarSyncService } from './services/google-calendar-sync.service';

/**
 * Connects a member's personal Google Calendar, both directions: reads their
 * own events into the in-app view, and writes church services/events/
 * gatherings into a dedicated calendar in their Google account.
 *
 * Separate controller from the church-calendar export (`calendar.controller.ts`)
 * because the concerns don't overlap: that one is the .ics feed anyone's
 * calendar app can subscribe to; this one is the OAuth-based two-way link for
 * members who specifically connect their Google account.
 */
@ApiTags('calendar')
@Controller('calendar/google')
export class GoogleCalendarController {
  private readonly logger = new Logger(GoogleCalendarController.name);

  constructor(
    private readonly oauth: GoogleCalendarOAuthService,
    private readonly connections: GoogleCalendarConnectionService,
    private readonly events: GoogleCalendarEventsService,
    private readonly sync: GoogleCalendarSyncService,
  ) {}

  @Get('connect')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the Google consent URL to connect my calendar' })
  connect(@CurrentUser() actor: AuthUser, @Headers('origin') origin: string | undefined) {
    if (!actor.profileId || !actor.tenantId) {
      throw new ServiceUnavailableException('No profile is linked to this account');
    }
    // The frontend's own Origin header decides where the callback eventually
    // redirects back to (validated against the same allowlist CORS trusts) —
    // no static FRONTEND_URL to keep in sync with wherever it's deployed.
    const url = this.oauth.buildConsentUrl(actor.profileId, actor.tenantId, origin);
    return { url };
  }

  /**
   * Google redirects the member's browser here after consent — a plain
   * navigation, not an API call, so it ends in a redirect back into the app
   * rather than a JSON response.
   */
  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'OAuth redirect target — exchanges the code and redirects back' })
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    // Before state is verified there's no trustworthy origin yet to redirect
    // to — a bare failure at this point (missing code/state, or a state that
    // fails verification) has nowhere safe to send the browser but the
    // server's own fallback default.
    const fallbackRedirect = (status: 'connected' | 'error') =>
      res.redirect(`${this.oauth.resolveReturnOrigin(undefined)}/dashboard/calendar?google=${status}`);

    if (error || !code || !state) {
      return fallbackRedirect('error');
    }

    let userId: string, tenantId: string, origin: string;
    try {
      ({ userId, tenantId, origin } = this.oauth.verifyState(state));
    } catch {
      return fallbackRedirect('error');
    }
    const redirect = (status: 'connected' | 'error') => res.redirect(`${origin}/dashboard/calendar?google=${status}`);

    try {
      const client = this.oauth.createClient();
      const { tokens } = await client.getToken(code);

      if (!tokens.access_token || !tokens.expiry_date) {
        return redirect('error');
      }

      client.setCredentials(tokens);
      let googleEmail: string | null = null;
      try {
        const oauth2 = google.oauth2({ version: 'v2', auth: client });
        const info = await oauth2.userinfo.get();
        googleEmail = info.data.email ?? null;
      } catch {
        // Non-fatal: the connection still works without a display email.
      }

      await this.connections.save(userId, tenantId, googleEmail, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        scope: tokens.scope ?? '',
      });

      // Best-effort: the connection is real either way, and the periodic job
      // (or a manual "Sync now") will catch up if this first push fails.
      this.sync
        .syncForMember(userId, tenantId)
        .catch((err: Error) => this.logger.warn(`Initial Google Calendar sync failed: ${err.message}`));

      return redirect('connected');
    } catch {
      return redirect('error');
    }
  }

  @Get('status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Whether I have a connected Google Calendar' })
  async status(@CurrentUser() actor: AuthUser) {
    if (!actor.profileId || !actor.tenantId) {
      return { connected: false, googleEmail: null, connectedAt: null };
    }
    return this.connections.status(actor.profileId, actor.tenantId);
  }

  @Post('disconnect')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Disconnect my Google Calendar' })
  async disconnect(@CurrentUser() actor: AuthUser) {
    if (!actor.profileId || !actor.tenantId) {
      throw new ServiceUnavailableException('No profile is linked to this account');
    }
    await this.connections.revoke(actor.profileId, actor.tenantId);
    return { disconnected: true };
  }

  @Get('events')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "My own upcoming events, from my connected Google Calendar" })
  async myEvents(@CurrentUser() actor: AuthUser) {
    if (!actor.profileId || !actor.tenantId) {
      throw new ServiceUnavailableException('No profile is linked to this account');
    }
    return this.events.listUpcoming(actor.profileId, actor.tenantId);
  }

  /**
   * Manual "Sync now" — the periodic job (every 6 hours) covers this
   * automatically, but a member who just added a service wants to see it on
   * their Google Calendar immediately, not on the next scheduled sweep.
   */
  @Post('sync')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Push church services/events/gatherings into my Google Calendar now' })
  async syncNow(@CurrentUser() actor: AuthUser) {
    if (!actor.profileId || !actor.tenantId) {
      throw new ServiceUnavailableException('No profile is linked to this account');
    }
    return this.sync.syncForMember(actor.profileId, actor.tenantId);
  }
}
