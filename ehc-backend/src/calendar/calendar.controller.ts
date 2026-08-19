import { Controller, Get, NotFoundException, Param, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CalendarEventService } from './services/calendar-event.service';
import { CalendarFeedService } from './services/calendar-feed.service';
import { CalendarTokenService } from './services/calendar-token.service';

/** Thin controller: every branch below delegates to a service. */
@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly events: CalendarEventService,
    private readonly feed: CalendarFeedService,
    private readonly tokens: CalendarTokenService,
  ) {}

  // ── Single-event downloads (public) ────────────────────────────────────────

  @Public()
  @Get('service/:id.ics')
  @ApiOperation({ summary: 'Download a single service as .ics' })
  async serviceIcs(@Param('id') id: string, @Res() res: Response) {
    const { filename, body } = await this.events.serviceIcs(id);
    this.sendIcs(res, filename, body, 'attachment');
  }

  @Public()
  @Get('event/:idOrSlug.ics')
  @ApiOperation({ summary: 'Download a single event as .ics' })
  async eventIcs(@Param('idOrSlug') idOrSlug: string, @Res() res: Response) {
    const { filename, body } = await this.events.eventIcs(idOrSlug);
    this.sendIcs(res, filename, body, 'attachment');
  }

  @Public()
  @Get('gathering/:id.ics')
  @ApiOperation({ summary: 'Download a recurring gathering as .ics' })
  async gatheringIcs(@Param('id') id: string, @Res() res: Response) {
    const { filename, body } = await this.events.gatheringIcs(id);
    this.sendIcs(res, filename, body, 'attachment');
  }

  // ── Personal subscription feed ─────────────────────────────────────────────

  /**
   * The live feed. Public because calendar clients cannot send an Authorization
   * header; the token in the path is the credential, and it is resolved to a
   * member server-side so the response is scoped to exactly what that member
   * may see.
   *
   * Rate limited harder than a normal read: this is an unauthenticated,
   * guessable-shaped URL, so the limit is what makes brute-forcing the token
   * space impractical rather than merely expensive.
   *
   * Unknown and revoked tokens both 404, deliberately identically — a distinct
   * "revoked" response would confirm that a guessed token had once been valid.
   */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get(':token.ics')
  @ApiOperation({ summary: 'Personal calendar subscription feed' })
  async memberFeed(@Param('token') token: string, @Res() res: Response) {
    const owner = await this.tokens.resolve(token);
    if (!owner) throw new NotFoundException('Calendar feed not found');

    const body = await this.feed.buildForMember(owner.userId, owner.tenantId);
    // inline, not attachment: a subscribing client fetches this on a schedule
    // and should never trigger a download dialog.
    this.sendIcs(res, 'everlasting-hills.ics', body, 'inline');
  }

  // ── Token management (authenticated) ───────────────────────────────────────

  @Get('me/feed-token')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get (or create) my calendar feed token' })
  async myToken(@CurrentUser() actor: AuthUser) {
    const { token, createdAt } = await this.tokens.getOrCreate(actor);
    return { token, createdAt };
  }

  @Post('me/feed-token/regenerate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke my calendar feed link and issue a new one' })
  async regenerate(@CurrentUser() actor: AuthUser) {
    const { token, createdAt } = await this.tokens.regenerate(actor);
    return { token, createdAt };
  }

  /**
   * Writes the calendar body directly. Bypasses the response envelope
   * interceptor on purpose: a calendar client needs raw text/calendar, and
   * wrapping it in the API's JSON envelope would make the feed unparseable.
   */
  private sendIcs(
    res: Response,
    filename: string,
    body: string,
    disposition: 'inline' | 'attachment',
  ): void {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    // Never store a personal feed in a shared cache. It is keyed only by a
    // bearer token in the URL, so a CDN or proxy holding it could serve one
    // member's calendar to another.
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(body);
  }
}
