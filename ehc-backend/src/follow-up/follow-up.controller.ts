import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FollowUpSourceType, FollowUpStage, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateFollowUpEntryDto } from './dto/create-follow-up-entry.dto';
import { AssignFollowUpDto } from './dto/assign-follow-up.dto';
import { LogContactDto } from './dto/log-contact.dto';
import { ConfirmFollowUpDto } from './dto/confirm-follow-up.dto';
import { FollowUpAuthService } from './services/follow-up-auth.service';
import { FollowUpReadService } from './services/follow-up-read.service';
import { FollowUpIntakeService } from './services/follow-up-intake.service';
import { FollowUpProgressService } from './services/follow-up-progress.service';
import { FollowUpPickersService } from './services/follow-up-pickers.service';
import { FollowUpAutoSurfaceService } from './services/follow-up-auto-surface.service';

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
 * are enforced inside the injected services since a guard can't express "leader of
 * *this* unit" or "assignee of *this* entry" — same convention as UnitsController.
 */
@ApiTags('follow-up')
@Controller('follow-up')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class FollowUpController {
  constructor(
    private readonly auth: FollowUpAuthService,
    private readonly read: FollowUpReadService,
    private readonly intake: FollowUpIntakeService,
    private readonly progress: FollowUpProgressService,
    private readonly pickers: FollowUpPickersService,
    private readonly autoSurface: FollowUpAutoSurfaceService,
  ) {}

  // ── Pickers (declared before :id so Express doesn't swallow them as params) ──

  @Get('candidates')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Search first-timers (Visitor) or absentees (Member) to add to the Master List (UNIT_LEAD+)' })
  @ApiQuery({ name: 'type', enum: FollowUpSourceType })
  @ApiQuery({ name: 'q', required: false })
  async candidates(@Query('type') type: string, @Query('q') q?: string) {
    return this.pickers.candidates(parseSourceType(type), q ?? '');
  }

  @Get('team')
  @ApiOperation({ summary: "This unit's roster, for the assignee picker (MEMBER+, defaults to caller's own unit)" })
  @ApiQuery({ name: 'unitId', required: false })
  async team(@CurrentUser() actor: AuthUser, @Query('unitId') unitId?: string) {
    return this.pickers.team(actor, unitId);
  }

  @Get('services')
  @ApiOperation({ summary: 'Recent services, for the Follow-Up page\'s service-day filter (MEMBER+)' })
  async listServices() {
    return this.read.listServices();
  }

  @Get('access')
  @ApiOperation({
    summary:
      'Whether the caller can view the Follow-Up pipeline (MEMBER+ auth, but real access requires being on a team or ADMIN+) — used to decide whether to show the nav link.',
  })
  async checkAccess(@CurrentUser() actor: AuthUser) {
    return this.auth.checkAccess(actor);
  }

  @Post('auto-surface/run')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Manually run the daily auto-surface job now (ADMIN+): creates Master List entries for at-risk absentees and new visitors that don\'t have one yet. Safe to re-run — already-surfaced pairs are skipped permanently.',
  })
  async runAutoSurface() {
    return this.autoSurface.autoSurfaceEntries();
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
  @ApiQuery({ name: 'serviceId', required: false, description: 'Narrow to a specific service day' })
  async list(
    @CurrentUser() actor: AuthUser,
    @Query('unitId') unitId?: string,
    @Query('stage') stage?: string,
    @Query('mine') mine?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.read.list(actor, { unitId, stage: parseStage(stage), mine: mine === 'true', serviceId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one follow-up entry with its full contact log (MEMBER+, visible church-wide)' })
  async getOne(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.read.getOne(actor, id);
  }

  // ── Write ─────────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Add a first-timer or absentee to the Master List (UNIT_LEAD+)' })
  @ApiBody({ type: CreateFollowUpEntryDto })
  async create(@CurrentUser() actor: AuthUser, @Body() body: CreateFollowUpEntryDto) {
    return this.intake.create(actor, body);
  }

  @Patch(':id/assign')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Assign or reassign a team member (UNIT_LEAD+ of that unit)' })
  @ApiBody({ type: AssignFollowUpDto })
  async assign(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: AssignFollowUpDto) {
    return this.intake.assign(actor, id, body);
  }

  @Post(':id/logs')
  @ApiOperation({ summary: 'Log a contact attempt (MEMBER+, must be the assignee or the unit leader)' })
  @ApiBody({ type: LogContactDto })
  async logContact(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: LogContactDto) {
    return this.progress.logContact(actor, id, body);
  }

  @Patch(':id/confirm')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Log a final outcome for this entry — available any time, not gated on a review hand-off (UNIT_LEAD+ of that unit)' })
  @ApiBody({ type: ConfirmFollowUpDto })
  async confirm(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: ConfirmFollowUpDto) {
    return this.progress.confirm(actor, id, body);
  }
}
