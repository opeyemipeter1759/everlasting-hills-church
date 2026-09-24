import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FollowUpSourceType, FollowUpStage, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateFollowUpEntryDto } from './dto/create-follow-up-entry.dto';
import { AssignFollowUpDto } from './dto/assign-follow-up.dto';
import { LogContactDto } from './dto/log-contact.dto';
import { ConfirmFollowUpDto } from './dto/confirm-follow-up.dto';
import { QuickCaptureDto } from './dto/quick-capture.dto';
import { BulkReassignDto } from './dto/bulk-reassign.dto';
import { SnoozeFollowUpDto } from './dto/snooze-follow-up.dto';
import { MarkPresentDto } from './dto/mark-present.dto';
import { UpdateConnectionStatusDto } from './dto/update-connection-status.dto';
import { FollowUpAuthService } from './services/follow-up-auth.service';
import { FollowUpReadService } from './services/follow-up-read.service';
import { FollowUpIntakeService } from './services/follow-up-intake.service';
import { FollowUpProgressService } from './services/follow-up-progress.service';
import { FollowUpPickersService } from './services/follow-up-pickers.service';
import { FollowUpAutoSurfaceService } from './services/follow-up-auto-surface.service';
import { FollowUpPastorEscalationService } from './services/follow-up-pastor-escalation.service';
import { FollowUpConnectionsService } from './services/follow-up-connections.service';
import { FollowUpGamificationService } from './services/follow-up-gamification.service';
import { FollowUpMasterListService } from './services/follow-up-master-list.service';
import { FollowUpPersonService } from './services/follow-up-person.service';
import { FollowUpStatusService } from './services/follow-up-status.service';
import { FollowUpStatusPendingService } from './services/follow-up-status-pending.service';
import { FollowUpStatusBulkService } from './services/follow-up-status-bulk.service';
import { FollowUpCountsService } from './services/follow-up-counts.service';
import type { MasterListScope } from './services/master-list-filter.util';
import { FollowUpWorkloadService } from './services/follow-up-workload.service';
import { RequestStatusChangeDto, DecideStatusChangeDto, BulkStatusChangeDto } from './dto/status-change.dto';
import { AddFollowUpNoteDto, EditFollowUpNoteDto, ReactToNoteDto } from './dto/follow-up-note.dto';
import { FollowUpNotesService } from './services/follow-up-notes.service';

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
// HOD is listed next to UNIT_LEAD on the leader routes below on purpose: the
// guard treats HOD as lateral (it never inherits UNIT_LEAD routes wholesale),
// so each follow-up route opts in explicitly, and FollowUpAuthService then
// scopes a department head to the units inside their own department.
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
    private readonly pastorEscalation: FollowUpPastorEscalationService,
    private readonly connections: FollowUpConnectionsService,
    private readonly gamification: FollowUpGamificationService,
    private readonly masterListService: FollowUpMasterListService,
    private readonly personService: FollowUpPersonService,
    private readonly statusService: FollowUpStatusService,
    private readonly statusPending: FollowUpStatusPendingService,
    private readonly statusBulk: FollowUpStatusBulkService,
    private readonly counts: FollowUpCountsService,
    private readonly notes: FollowUpNotesService,
    private readonly workload: FollowUpWorkloadService,
  ) {}

  // ── Pickers (declared before :id so Express doesn't swallow them as params) ──

  @Get('candidates')
  @Roles(Role.UNIT_LEAD, Role.HOD)
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

  /**
   * The Master List: every member of the church, with who is following them up
   * and where they stand. Behind the same team check as the rest of Follow Up
   * — it names every member, so it is not for anyone who merely signed in.
   */
  @Get('master-list')
  @ApiOperation({ summary: 'Every church member with their follow-up status (Follow-Up team only)' })
  @ApiQuery({ name: 'status', required: false, description: 'One of the Master List statuses.' })
  @ApiQuery({ name: 'from', required: false, description: 'Joined or first came on or after this day.' })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'assigneeId', required: false, description: '"none" for nobody assigned.' })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['FOLLOW_UP', 'INTEGRATION', 'ALL'],
    description: "FOLLOW_UP leaves out anyone integrated; INTEGRATION shows only those and anyone who has gone away.",
  })
  @ApiQuery({ name: 'absentFrom', required: false, description: 'A service id: only the members who missed that service.' })
  async masterList(
    @CurrentUser() actor: AuthUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('scope') scope?: MasterListScope,
    @Query('absentFrom') absentFrom?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    await this.auth.requireAccess(actor);
    return this.masterListService.list({
      search,
      status,
      from,
      to,
      assigneeId,
      scope,
      absentFrom,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Get('workload')
  @ApiOperation({ summary: 'How many people each team member is following up (UNIT_LEAD/HOD+)' })
  async workloadByAssignee(@CurrentUser() actor: AuthUser) {
    return this.workload.byAssignee(actor);
  }

  /** One person from the Master List in full, for the detail drawer. */
  @Get('person/:kind/:id')
  @ApiOperation({ summary: 'Full details of one first-timer or member (Follow-Up team only)' })
  async person(@CurrentUser() actor: AuthUser, @Param('kind') kind: string, @Param('id') id: string) {
    await this.auth.requireAccess(actor);
    if (kind !== 'MEMBER' && kind !== 'VISITOR') {
      throw new BadRequestException('kind must be MEMBER or VISITOR');
    }
    return this.personService.get(kind, id);
  }

  /** The figures above the Master List, counted over the same people it lists. */
  @Get('counts')
  @ApiOperation({ summary: 'Master List totals by status, plus your own caseload (Follow-Up team only)' })
  async masterListCounts(@CurrentUser() actor: AuthUser) {
    await this.auth.requireAccess(actor);
    return this.counts.summary(actor);
  }

  /**
   * Ask for someone's status to be changed. Anyone on the team may ask; it
   * waits for a unit lead or head of department unless the asker is one.
   */
  @Post('status')
  @ApiOperation({ summary: 'Request a Master List status change (Follow-Up team; approved on sight for a lead/HOD)' })
  async requestStatusChange(@CurrentUser() actor: AuthUser, @Body() body: RequestStatusChangeDto) {
    await this.auth.requireAccess(actor);
    return this.statusService.request(actor, body);
  }

  /** Set the status of everyone a leader has ticked, in one go. */
  @Post('status/bulk')
  @ApiOperation({ summary: 'Set the Master List status of several people at once (UNIT_LEAD/HOD+)' })
  async bulkStatusChange(@CurrentUser() actor: AuthUser, @Body() body: BulkStatusChangeDto) {
    await this.auth.requireAccess(actor);
    return this.statusBulk.apply(actor, body);
  }

  @Get('status/pending')
  @ApiOperation({ summary: 'Status changes waiting on approval (UNIT_LEAD/HOD+)' })
  async pendingStatusChanges(@CurrentUser() actor: AuthUser) {
    return this.statusPending.list(actor);
  }

  @Post('status/:id/decide')
  @ApiOperation({ summary: 'Approve or reject a status change (UNIT_LEAD/HOD+)' })
  async decideStatusChange(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: DecideStatusChangeDto,
  ) {
    return this.statusService.decide(actor, id, body.approve);
  }

  // ── The team's conversation about one person ─────────────────────────────

  @Get('notes/:kind/:id')
  @ApiOperation({ summary: "Messages on someone's follow-up thread (Follow-Up team only)" })
  async listNotes(@CurrentUser() actor: AuthUser, @Param('kind') kind: string, @Param('id') id: string) {
    await this.auth.requireAccess(actor);
    return this.notes.list(actor, kind, id);
  }

  @Post('notes/:kind/:id')
  @ApiOperation({ summary: 'Post a message to the thread (Follow-Up team only)' })
  async addNote(
    @CurrentUser() actor: AuthUser,
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() body: AddFollowUpNoteDto,
  ) {
    await this.auth.requireAccess(actor);
    return this.notes.add(actor, kind, id, body.body, body.parentId);
  }

  @Post('notes/:noteId/reactions')
  @ApiOperation({ summary: 'Add or take back an emoji on a message (Follow-Up team only)' })
  async reactToNote(@CurrentUser() actor: AuthUser, @Param('noteId') noteId: string, @Body() body: ReactToNoteDto) {
    await this.auth.requireAccess(actor);
    return this.notes.react(actor, noteId, body.emoji);
  }

  @Patch('notes/:noteId')
  @ApiOperation({ summary: 'Edit your own message' })
  async editNote(@CurrentUser() actor: AuthUser, @Param('noteId') noteId: string, @Body() body: EditFollowUpNoteDto) {
    await this.auth.requireAccess(actor);
    return this.notes.edit(actor, noteId, body.body);
  }

  @Delete('notes/:noteId')
  @ApiOperation({ summary: "Delete your own message, or any if you lead the unit" })
  async deleteNote(@CurrentUser() actor: AuthUser, @Param('noteId') noteId: string) {
    await this.auth.requireAccess(actor);
    return this.notes.remove(actor, noteId);
  }

  @Get('access')
  @ApiOperation({
    summary:
      'Whether the caller can view the Follow-Up pipeline (MEMBER+ auth, but real access requires being on a team or ADMIN+) — used to decide whether to show the nav link.',
  })
  async checkAccess(@CurrentUser() actor: AuthUser) {
    return this.auth.checkAccess(actor);
  }

  @Get('my-unit')
  @ApiOperation({
    summary:
      "The unit whose leader controls (Team roster, Bulk reassign) the caller should see: their own led/assisted unit, or the \"Follow-Up\" unit for ADMIN+/PASTOR/SUPER_ADMIN with no team of their own (MEMBER+ auth, null for anyone else).",
  })
  async myUnit(@CurrentUser() actor: AuthUser) {
    return this.auth.resolveMyUnit(actor);
  }

  @Get('reports-unit')
  @ApiOperation({
    summary:
      'Whether the caller may see Follow-Up Service Reports: the "Follow-Up" unit, only for its own lead or PASTOR/ADMIN_HEAD/ADMIN/SUPER_ADMIN — unlike my-unit, a lead of some other team does not qualify (MEMBER+ auth, null for anyone else).',
  })
  async reportsUnit(@CurrentUser() actor: AuthUser) {
    return this.auth.resolveReportsUnit(actor);
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

  @Post('services/:serviceId/backfill')
  @Roles(Role.UNIT_LEAD, Role.HOD)
  @ApiOperation({
    summary:
      'On-demand backfill for one past service (UNIT_LEAD+): surfaces whoever was absent from it and any still-unconverted first-timers from it, even if the daily sweep never covered that day. Safe to re-run — already-surfaced pairs are skipped.',
  })
  async backfillService(@Param('serviceId') serviceId: string) {
    return this.autoSurface.backfillForService(serviceId);
  }

  @Post('quick-capture')
  @ApiOperation({ summary: 'One-tap door capture: create a bare name+phone visitor and route them into the pipeline (MEMBER+)' })
  @ApiBody({ type: QuickCaptureDto })
  async quickCapture(@CurrentUser() actor: AuthUser, @Body() body: QuickCaptureDto) {
    return this.intake.quickCapture(actor, body);
  }

  @Patch('bulk-reassign')
  @Roles(Role.UNIT_LEAD, Role.HOD)
  @ApiOperation({ summary: "Move a whole caseload from one team member to another within one unit (UNIT_LEAD+)" })
  @ApiBody({ type: BulkReassignDto })
  async bulkReassign(@CurrentUser() actor: AuthUser, @Body() body: BulkReassignDto) {
    return this.intake.bulkReassign(actor, body);
  }

  @Get('wins')
  @ApiOperation({ summary: 'Recent wins across the church — confirmed positive outcomes and connections made (MEMBER+)' })
  async wins() {
    return this.gamification.wins();
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Contacts logged, connections made, and outcomes confirmed this week/month (MEMBER+)' })
  @ApiQuery({ name: 'period', enum: ['week', 'month'], required: false })
  async leaderboard(@CurrentUser() actor: AuthUser, @Query('period') period?: string) {
    const p = period === 'month' ? 'month' : 'week';
    const result = await this.gamification.leaderboard(p);
    return this.gamification.withViewer(actor, result, p);
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
  @ApiQuery({ name: 'pastoral', required: false, type: Boolean, description: 'Only entries sent to the Pastor' })
  async list(
    @CurrentUser() actor: AuthUser,
    @Query('unitId') unitId?: string,
    @Query('stage') stage?: string,
    @Query('mine') mine?: string,
    @Query('serviceId') serviceId?: string,
    @Query('pastoral') pastoral?: string,
  ) {
    return this.read.list(actor, { unitId, stage: parseStage(stage), mine: mine === 'true', serviceId, pastoral: pastoral === 'true' });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one follow-up entry with its full contact log (MEMBER+, visible church-wide)' })
  async getOne(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.read.getOne(actor, id);
  }

  // ── Write ─────────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.UNIT_LEAD, Role.HOD)
  @ApiOperation({ summary: 'Add a first-timer or absentee to the Master List (UNIT_LEAD+)' })
  @ApiBody({ type: CreateFollowUpEntryDto })
  async create(@CurrentUser() actor: AuthUser, @Body() body: CreateFollowUpEntryDto) {
    return this.intake.create(actor, body);
  }

  @Patch(':id/assign')
  @Roles(Role.UNIT_LEAD, Role.HOD)
  @ApiOperation({ summary: 'Assign or reassign a team member (UNIT_LEAD+ of that unit)' })
  @ApiBody({ type: AssignFollowUpDto })
  async assign(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: AssignFollowUpDto) {
    return this.intake.assign(actor, id, body);
  }

  @Post(':id/logs')
  @ApiOperation({ summary: 'Log a contact attempt or a lightweight quick update (MEMBER+, must be the assignee or the unit leader)' })
  @ApiBody({ type: LogContactDto })
  async logContact(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: LogContactDto) {
    return this.progress.logContact(actor, id, body);
  }

  @Patch(':id/confirm')
  @Roles(Role.UNIT_LEAD, Role.HOD)
  @ApiOperation({ summary: 'Log a final outcome for this entry — available any time, not gated on a review hand-off (UNIT_LEAD+ of that unit)' })
  @ApiBody({ type: ConfirmFollowUpDto })
  async confirm(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: ConfirmFollowUpDto) {
    return this.progress.confirm(actor, id, body);
  }

  @Post(':id/mark-present')
  @ApiOperation({ summary: "Mark this entry's subject present for a service — for a missed check-in (assignee or leader)" })
  @ApiBody({ type: MarkPresentDto })
  async markPresent(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: MarkPresentDto) {
    return this.progress.markPresent(actor, id, body.serviceId);
  }

  @Patch(':id/snooze')
  @ApiOperation({ summary: '"Call back later" — hides the entry from Today until the given date (assignee or leader)' })
  @ApiBody({ type: SnoozeFollowUpDto })
  async snooze(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: SnoozeFollowUpDto) {
    return this.progress.snooze(actor, id, body.until ?? null);
  }

  @Post(':id/send-to-pastor')
  @Roles(Role.UNIT_LEAD, Role.HOD)
  @ApiOperation({ summary: "Send a first-timer's details to the Pastor by email + a pre-filled WhatsApp link (UNIT_LEAD+ of that unit)" })
  async sendToPastor(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.pastorEscalation.sendToPastor(actor, id);
  }

  @Get(':id/connections')
  @ApiOperation({ summary: 'Suggested (and acted-on) friend matches for this entry\'s subject (MEMBER+)' })
  async listConnections(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.connections.list(actor, id);
  }

  @Post(':id/connections/:connectionId/introduce')
  @ApiOperation({ summary: 'Mark a suggested connection as introduced — logs it to the entry\'s timeline (assignee or leader)' })
  async introduceConnection(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Param('connectionId') connectionId: string) {
    return this.connections.introduce(actor, id, connectionId);
  }

  @Patch(':id/connections/:connectionId')
  @ApiOperation({ summary: 'Record whether an introduced connection actually stuck (assignee or leader)' })
  @ApiBody({ type: UpdateConnectionStatusDto })
  async updateConnection(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Param('connectionId') connectionId: string,
    @Body() body: UpdateConnectionStatusDto,
  ) {
    return this.connections.updateStatus(actor, id, connectionId, body.status);
  }
}
