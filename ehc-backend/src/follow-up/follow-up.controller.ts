import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FollowUpSourceType, FollowUpStage, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { FollowUpService } from './follow-up.service';
import { CreateFollowUpEntryDto } from './dto/create-follow-up-entry.dto';
import { AssignFollowUpDto } from './dto/assign-follow-up.dto';
import { LogContactDto } from './dto/log-contact.dto';
import { ConfirmFollowUpDto } from './dto/confirm-follow-up.dto';
import { RejectFollowUpDto } from './dto/reject-follow-up.dto';

function parseStage(stage?: string): FollowUpStage | undefined {
  if (!stage) return undefined;
  if (!(Object.values(FollowUpStage) as string[]).includes(stage)) {
    throw new BadRequestException(`Invalid stage: ${stage}`);
  }
  return stage as FollowUpStage;
}

function parseSourceType(type?: string): FollowUpSourceType {
  if (type && (Object.values(FollowUpSourceType) as string[]).includes(type)) {
    return type as FollowUpSourceType;
  }
  throw new BadRequestException('type must be FIRST_TIMER or ABSENTEE');
}

/**
 * Follow-Up Pipeline: a unit's Master List of first-timers and absentees.
 * Base access is any unit member (MEMBER+); leader-only and assignee-only actions
 * are enforced inside FollowUpService since a guard can't express "leader of *this*
 * unit" or "assignee of *this* entry" — same convention as UnitsController.
 */
@ApiTags('follow-up')
@Controller('follow-up')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class FollowUpController {
  constructor(private readonly followUp: FollowUpService) {}

  // ── Pickers (declared before :id so Express doesn't swallow them as params) ──

  @Get('candidates')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Search first-timers (Visitor) or absentees (Member) to add to the Master List (UNIT_LEAD+)' })
  @ApiQuery({ name: 'type', enum: FollowUpSourceType })
  @ApiQuery({ name: 'q', required: false })
  async candidates(@Query('type') type: string, @Query('q') q?: string) {
    return this.followUp.candidates(parseSourceType(type), q ?? '');
  }

  @Get('team')
  @ApiOperation({ summary: "This unit's roster, for the assignee picker (MEMBER+, defaults to caller's own unit)" })
  @ApiQuery({ name: 'unitId', required: false })
  async team(@CurrentUser() actor: AuthUser, @Query('unitId') unitId?: string) {
    return this.followUp.team(actor, unitId);
  }

  @Get('access')
  @ApiOperation({
    summary:
      'Whether the caller can view the Follow-Up pipeline (MEMBER+ auth, but real access requires being on a team or ADMIN+) — used to decide whether to show the nav link.',
  })
  async checkAccess(@CurrentUser() actor: AuthUser) {
    return this.followUp.checkAccess(actor);
  }

  @Post('auto-surface/run')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Manually run the daily auto-surface job now (ADMIN+): creates Master List entries for at-risk absentees and new visitors that don\'t have one yet. Safe to re-run — already-surfaced pairs are skipped permanently.',
  })
  async runAutoSurface() {
    return this.followUp.autoSurfaceEntries();
  }

  // ── Read ──────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary:
      'List the follow-up Master List (MEMBER+). Church-wide by default — every unit member sees the same entries and totals; pass unitId to narrow to one team.',
  })
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'stage', required: false, enum: FollowUpStage })
  @ApiQuery({ name: 'mine', required: false, type: Boolean })
  async list(
    @CurrentUser() actor: AuthUser,
    @Query('unitId') unitId?: string,
    @Query('stage') stage?: string,
    @Query('mine') mine?: string,
  ) {
    return this.followUp.list(actor, { unitId, stage: parseStage(stage), mine: mine === 'true' });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one follow-up entry with its full contact log (MEMBER+, visible church-wide)' })
  async getOne(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.followUp.getOne(actor, id);
  }

  // ── Write ─────────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Add a first-timer or absentee to the Master List (UNIT_LEAD+)' })
  @ApiBody({ type: CreateFollowUpEntryDto })
  async create(@CurrentUser() actor: AuthUser, @Body() body: CreateFollowUpEntryDto) {
    return this.followUp.create(actor, body);
  }

  @Patch(':id/assign')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Assign or reassign a team member (UNIT_LEAD+ of that unit)' })
  @ApiBody({ type: AssignFollowUpDto })
  async assign(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: AssignFollowUpDto) {
    return this.followUp.assign(actor, id, body);
  }

  @Post(':id/logs')
  @ApiOperation({ summary: 'Log a contact attempt (MEMBER+, must be the assignee or the unit leader)' })
  @ApiBody({ type: LogContactDto })
  async logContact(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: LogContactDto) {
    return this.followUp.logContact(actor, id, body);
  }

  @Patch(':id/ready')
  @ApiOperation({ summary: 'Mark ready to close, for review (MEMBER+, must be the assignee or the unit leader)' })
  async markReady(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.followUp.markReady(actor, id);
  }

  @Patch(':id/confirm')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Confirm and archive an awaiting-review entry (UNIT_LEAD+ of that unit)' })
  @ApiBody({ type: ConfirmFollowUpDto })
  async confirm(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: ConfirmFollowUpDto) {
    return this.followUp.confirm(actor, id, body);
  }

  @Patch(':id/reject')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Reject and reopen an awaiting-review entry (UNIT_LEAD+ of that unit)' })
  @ApiBody({ type: RejectFollowUpDto })
  async reject(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: RejectFollowUpDto) {
    return this.followUp.reject(actor, id, body);
  }
}
