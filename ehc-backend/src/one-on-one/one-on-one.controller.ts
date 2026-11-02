import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { Throttle } from '@nestjs/throttler';
import {
  AddDelegateDto,
  ApproveDto,
  CreateBlockDto,
  CreateRequestDto,
  SetMeetingLinkDto,
  CreateSessionTypeDto,
  DecisionNoteDto,
  ProposeTimeDto,
  ReplaceRulesDto,
  SlotsQueryDto,
  UpdateHostSettingsDto,
  UpdateSessionTypeDto,
} from './dto/one-on-one.dto';
import { OneOnOneService } from './one-on-one.service';
import { OneOnOneRequestsService } from './one-on-one-requests.service';

/** One-on-one sessions with the pastors. Management routes are authorized per pastor (owner, delegate or Super Admin) in the service. */
@ApiTags('one-on-one')
@ApiBearerAuth('access-token')
@Controller('one-on-one')
export class OneOnOneController {
  constructor(
    private readonly oneOnOne: OneOnOneService,
    private readonly requests: OneOnOneRequestsService,
  ) {}

  // ── Members ───────────────────────────────────────────────────────────────

  @Get('hosts')
  @ApiOperation({ summary: 'Pastors taking one-on-one sessions, with session types and next opening' })
  listHosts() {
    return this.oneOnOne.listHosts('MEMBER');
  }

  @Get('hosts/:hostId/slots')
  @ApiOperation({ summary: 'Open start times for a session type over a date range (max two months)' })
  getSlots(@Param('hostId') hostId: string, @Query() query: SlotsQueryDto) {
    return this.oneOnOne.getSlots(hostId, query);
  }

  @Post('requests')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Request a session at one of the open times; held while the pastor decides' })
  createRequest(@CurrentUser() user: AuthUser, @Body() body: CreateRequestDto) {
    return this.requests.createMemberRequest(user, body);
  }

  @Get('requests/mine')
  @ApiOperation({ summary: 'My requests and sessions, newest first' })
  listMine(@CurrentUser() user: AuthUser) {
    return this.requests.listMine(user);
  }

  @Post('requests/:id/cancel')
  @ApiOperation({ summary: 'Withdraw a request, or cancel an approved session up to 24 hours before' })
  cancelMine(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: DecisionNoteDto) {
    return this.requests.cancelMine(user, id, body);
  }

  @Post('requests/:id/accept-proposal')
  @ApiOperation({ summary: 'Accept the time the pastor suggested' })
  acceptProposal(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.requests.acceptProposal(user, id);
  }

  @Get('requests/:id/calendar.ics')
  @ApiOperation({ summary: 'An approved session as a calendar file' })
  async ics(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res() res: Response) {
    const { filename, body } = await this.requests.icsForMember(user, id);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(body);
  }

  // ── Pastors and delegates ─────────────────────────────────────────────────

  @Get('manage/hosts/:hostId/requests')
  @ApiOperation({ summary: 'Waiting, suggested, upcoming and recent sessions for a pastor' })
  listForHost(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string) {
    return this.requests.listForHost(user, hostId);
  }

  @Post('manage/hosts/:hostId/requests/:id/approve')
  @ApiOperation({ summary: 'Approve a request, optionally with a Google Meet or Zoom link' })
  approve(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Param('id') id: string, @Body() body: ApproveDto) {
    return this.requests.approve(user, hostId, id, body);
  }

  @Post('manage/hosts/:hostId/requests/:id/link')
  @ApiOperation({ summary: 'Add or change the meeting link on an upcoming session' })
  setLink(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Param('id') id: string, @Body() body: SetMeetingLinkDto) {
    return this.requests.setMeetingLink(user, hostId, id, body);
  }

  @Post('manage/hosts/:hostId/requests/:id/decline')
  @ApiOperation({ summary: 'Decline a request, with an optional note' })
  decline(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Param('id') id: string, @Body() body: DecisionNoteDto) {
    return this.requests.decline(user, hostId, id, body);
  }

  @Post('manage/hosts/:hostId/requests/:id/propose')
  @ApiOperation({ summary: 'Suggest a different open time' })
  propose(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Param('id') id: string, @Body() body: ProposeTimeDto) {
    return this.requests.propose(user, hostId, id, body);
  }

  @Post('manage/hosts/:hostId/requests/:id/cancel')
  @ApiOperation({ summary: 'Cancel an approved session' })
  cancelApproved(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Param('id') id: string, @Body() body: DecisionNoteDto) {
    return this.requests.cancelApproved(user, hostId, id, body);
  }

  @Get('manage/context')
  @ApiOperation({ summary: 'Pastors I can manage, and whether I can set myself up as one' })
  getContext(@CurrentUser() user: AuthUser) {
    return this.oneOnOne.getManageContext(user);
  }

  @Post('manage/hosts/me')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Turn One-on-One on for myself (Pastor+)' })
  setUpMe(@CurrentUser() user: AuthUser) {
    return this.oneOnOne.setUpMyHost(user);
  }

  @Get('manage/people')
  @ApiOperation({ summary: 'Find someone to appoint as a delegate (pastors and Super Admin)' })
  searchPeople(@CurrentUser() user: AuthUser, @Query('q') q = '') {
    return this.oneOnOne.searchPeople(user, q);
  }

  @Get('manage/hosts/:hostId')
  @ApiOperation({ summary: 'A pastor’s settings, hours, days off, session types and delegates' })
  getHost(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string) {
    return this.oneOnOne.getHostDetail(user, hostId);
  }

  @Patch('manage/hosts/:hostId')
  @ApiOperation({ summary: 'Update profile and booking rules' })
  updateSettings(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Body() body: UpdateHostSettingsDto) {
    return this.oneOnOne.updateSettings(user, hostId, body);
  }

  @Put('manage/hosts/:hostId/rules')
  @ApiOperation({ summary: 'Replace the weekly hours' })
  replaceRules(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Body() body: ReplaceRulesDto) {
    return this.oneOnOne.replaceRules(user, hostId, body);
  }

  @Post('manage/hosts/:hostId/blocks')
  @ApiOperation({ summary: 'Block a whole day' })
  addBlock(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Body() body: CreateBlockDto) {
    return this.oneOnOne.addBlock(user, hostId, body);
  }

  @Delete('manage/hosts/:hostId/blocks/:blockId')
  @ApiOperation({ summary: 'Unblock a day' })
  removeBlock(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Param('blockId') blockId: string) {
    return this.oneOnOne.removeBlock(user, hostId, blockId);
  }

  @Post('manage/hosts/:hostId/session-types')
  @ApiOperation({ summary: 'Add a session type' })
  createSessionType(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Body() body: CreateSessionTypeDto) {
    return this.oneOnOne.createSessionType(user, hostId, body);
  }

  @Patch('manage/hosts/:hostId/session-types/:typeId')
  @ApiOperation({ summary: 'Edit or switch off a session type' })
  updateSessionType(
    @CurrentUser() user: AuthUser,
    @Param('hostId') hostId: string,
    @Param('typeId') typeId: string,
    @Body() body: UpdateSessionTypeDto,
  ) {
    return this.oneOnOne.updateSessionType(user, hostId, typeId, body);
  }

  @Get('manage/hosts/:hostId/preview')
  @ApiOperation({ summary: 'Preview the open times members will see' })
  preview(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Query() query: SlotsQueryDto) {
    return this.oneOnOne.previewSlots(user, hostId, query);
  }

  @Post('manage/hosts/:hostId/delegates')
  @ApiOperation({ summary: 'Appoint a delegate (the pastor or Super Admin only)' })
  addDelegate(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Body() body: AddDelegateDto) {
    return this.oneOnOne.addDelegate(user, hostId, body);
  }

  @Delete('manage/hosts/:hostId/delegates/:delegateId')
  @ApiOperation({ summary: 'Remove a delegate (the pastor or Super Admin only)' })
  removeDelegate(@CurrentUser() user: AuthUser, @Param('hostId') hostId: string, @Param('delegateId') delegateId: string) {
    return this.oneOnOne.removeDelegate(user, hostId, delegateId);
  }
}
