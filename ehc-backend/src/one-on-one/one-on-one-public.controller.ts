import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CreateVisitorRequestDto, DecisionNoteDto, SlotsQueryDto } from './dto/one-on-one.dto';
import { OneOnOneService } from './one-on-one.service';
import { OneOnOneRequestsService } from './one-on-one-requests.service';

/**
 * The visitor side: no account. Requests are confirmed by email, then reached
 * through the signed private link in that email (`:token`).
 */
@ApiTags('one-on-one-public')
@Public()
@Controller('public/one-on-one')
export class OneOnOnePublicController {
  constructor(
    private readonly oneOnOne: OneOnOneService,
    private readonly requests: OneOnOneRequestsService,
  ) {}

  @Get('hosts')
  @ApiOperation({ summary: 'Pastors taking visitor requests, with their share links' })
  listHosts() {
    return this.oneOnOne.listHosts('VISITOR');
  }

  @Get('intake')
  @ApiOperation({ summary: 'The general page’s sessions and times; names no pastor (null when not taking requests)' })
  async intake() {
    return (await this.oneOnOne.getPublicIntake()) ?? { unavailable: true };
  }

  @Get('hosts/:hostId/slots')
  @ApiOperation({ summary: 'Open times a visitor can request (max two months)' })
  getSlots(@Param('hostId') hostId: string, @Query() query: SlotsQueryDto) {
    return this.oneOnOne.getSlots(hostId, query, 'VISITOR');
  }

  @Post('requests')
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  @ApiOperation({ summary: 'Request a session; holds the time for 30 minutes until the email is confirmed' })
  create(@Body() body: CreateVisitorRequestDto) {
    return this.requests.createVisitorRequest(body);
  }

  @Get('requests/:token')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'A visitor’s own request, by the link from their email' })
  get(@Param('token') token: string) {
    return this.requests.getByToken(token);
  }

  @Post('requests/:token/confirm')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Confirm the email address; the request then reaches the pastor' })
  confirm(@Param('token') token: string) {
    return this.requests.confirmByToken(token);
  }

  @Post('requests/:token/cancel')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Withdraw, or cancel an approved session up to 24 hours before' })
  cancel(@Param('token') token: string, @Body() body: DecisionNoteDto) {
    return this.requests.cancelByToken(token, body);
  }

  @Post('requests/:token/accept-proposal')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Accept the time the pastor suggested' })
  accept(@Param('token') token: string) {
    return this.requests.acceptProposalByToken(token);
  }

  @Get('requests/:token/calendar.ics')
  @ApiOperation({ summary: 'An approved session as a calendar file' })
  async ics(@Param('token') token: string, @Res() res: Response) {
    const { filename, body } = await this.requests.icsByToken(token);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(body);
  }
}
