import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { UploadsService } from '../uploads/uploads.service';
import { hasValidFileSignature } from '../uploads/file-signature.util';
import {
  AssignEvangelismContactDto,
  EditEvangelismNoteDto,
  EvangelismNoteDto,
  ReactEvangelismNoteDto,
  EvangelismContactDto,
  EvangelismOutreachDto,
  EvangelismPerformanceQuery,
  EvangelismTaskDto,
  EvangelismTaskNoteDto,
  EvangelismTestimonyDto,
  ListEvangelismContactsQuery,
  ListEvangelismTasksQuery,
  LogEvangelismActionDto,
  ReviewEvangelismContactDto,
  UpdateEvangelismContactDto,
  UpdateEvangelismOutreachDto,
  UpdateEvangelismTaskDto,
  UpdateEvangelismTestimonyDto,
} from './dto/evangelism.dto';
import { EvangelismAccessService } from './services/evangelism-access.service';
import { EVANGELISM_NOTE_KIND, EvangelismContactsService } from './services/evangelism-contacts.service';
import { EvangelismNotesService } from './services/evangelism-notes.service';
import { EvangelismOutreachesService } from './services/evangelism-outreaches.service';
import { EvangelismPerformanceService } from './services/evangelism-performance.service';
import { EvangelismTasksService } from './services/evangelism-tasks.service';
import { EvangelismTestimoniesService } from './services/evangelism-testimonies.service';

const PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/**
 * The Evangelism Team's workspace. Everyone on the Evangelism unit (and church
 * admins) can view, add records, log follow-ups and work their tasks; the
 * unit's lead/assistant, the Growth & Outreach head and admins also edit,
 * delete, assign tasks and run outreaches. Access is checked per call by
 * EvangelismAccessService — the unit roster is the guest list.
 */
@ApiTags('evangelism')
@ApiBearerAuth('access-token')
@Controller('evangelism')
export class EvangelismController {
  constructor(
    private readonly access: EvangelismAccessService,
    private readonly contacts: EvangelismContactsService,
    private readonly tasks: EvangelismTasksService,
    private readonly outreaches: EvangelismOutreachesService,
    private readonly testimonies: EvangelismTestimoniesService,
    private readonly performance: EvangelismPerformanceService,
    private readonly uploads: UploadsService,
    private readonly notes: EvangelismNotesService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Whether I am on the Evangelism Team, and whether I lead it' })
  async me(@CurrentUser() user: AuthUser) {
    const v = await this.access.viewer(user);
    return { unitId: v.unitId, canLead: v.canLead, memberId: v.memberId };
  }

  /** Open to every signed-in member: anyone may preach, not only the team. */
  @Get('mine/tally')
  @ApiOperation({ summary: 'How many people I have preached to, and how many were saved' })
  async myTally(@CurrentUser() user: AuthUser) {
    if (!user.memberId) return { reached: 0, saved: 0, rededicated: 0, alreadySaved: 0, thisYear: { reached: 0, saved: 0 }, lastContactDate: null };
    return this.access.tally(user.memberId);
  }

  @Get('team')
  @ApiOperation({ summary: 'The Evangelism Team roster' })
  async team(@CurrentUser() user: AuthUser) {
    const v = await this.access.viewer(user);
    return this.access.team(v.unitId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Dashboard figures: reached, saved, follow-ups, visitations, invited/attended' })
  async summary(@CurrentUser() user: AuthUser) {
    return this.contacts.summary(await this.access.viewer(user));
  }

  // ── Contacts ───────────────────────────────────────────────────────────────

  @Get('contacts')
  @ApiOperation({ summary: 'Contacts, filtered; each with its 30-day window state' })
  async listContacts(@CurrentUser() user: AuthUser, @Query() q: ListEvangelismContactsQuery) {
    return this.contacts.list(await this.access.viewer(user), q);
  }

  @Post('contacts')
  @ApiOperation({ summary: 'Add a contact from the dashboard' })
  @ApiBody({ type: EvangelismContactDto })
  async createContact(@CurrentUser() user: AuthUser, @Body() body: EvangelismContactDto) {
    const v = await this.access.viewer(user);
    return this.contacts.create(v.unitId, body, { memberId: v.memberId, name: v.name }, 'DASHBOARD');
  }

  @Get('contacts/:id')
  @ApiOperation({ summary: 'A contact: details, follow-up history, tasks, testimonies' })
  async getContact(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.viewer(user);
    return this.contacts.get(id);
  }

  @Patch('contacts/:id')
  @ApiOperation({ summary: 'Edit a contact (leaders)' })
  @ApiBody({ type: UpdateEvangelismContactDto })
  async updateContact(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateEvangelismContactDto) {
    return this.contacts.update(await this.access.leader(user), id, body);
  }

  @Delete('contacts/:id')
  @ApiOperation({ summary: 'Delete a contact (leaders)' })
  async deleteContact(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.contacts.remove(await this.access.leader(user), id);
  }

  @Post('contacts/:id/actions')
  @ApiOperation({ summary: 'Log a follow-up and/or change status' })
  @ApiBody({ type: LogEvangelismActionDto })
  async logAction(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: LogEvangelismActionDto) {
    return this.contacts.logAction(await this.access.viewer(user), id, body);
  }

  @Post('contacts/:id/review')
  @ApiOperation({ summary: 'End-of-window decision: hand over, extend or close (leaders)' })
  @ApiBody({ type: ReviewEvangelismContactDto })
  async review(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: ReviewEvangelismContactDto) {
    return this.contacts.review(await this.access.leader(user), id, body);
  }

  @Post('contacts/:id/assign')
  @ApiOperation({ summary: 'Assign someone on the team to follow this person up (leaders)' })
  @ApiBody({ type: AssignEvangelismContactDto })
  async assign(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: AssignEvangelismContactDto) {
    return this.contacts.assign(await this.access.leader(user), id, body.assigneeMemberId ?? null);
  }

  // ── Feedback (same shape and routes as Follow Up's notes) ─────────────────

  @Get('notes/:kind/:contactId')
  @ApiOperation({ summary: "The team's feedback on a contact, as a thread" })
  async listNotes(@CurrentUser() user: AuthUser, @Param('kind') kind: string, @Param('contactId') contactId: string) {
    this.checkKind(kind);
    return this.notes.list(await this.access.viewer(user), contactId);
  }

  @Post('notes/:kind/:contactId')
  @ApiOperation({ summary: 'Post feedback on a contact, or reply to a message' })
  @ApiBody({ type: EvangelismNoteDto })
  async addNote(
    @CurrentUser() user: AuthUser,
    @Param('kind') kind: string,
    @Param('contactId') contactId: string,
    @Body() body: EvangelismNoteDto,
  ) {
    this.checkKind(kind);
    return this.notes.add(await this.access.viewer(user), contactId, body.body, body.parentId);
  }

  @Post('notes/:noteId/reactions')
  @ApiOperation({ summary: 'React to a feedback message; the same emoji again takes it back' })
  @ApiBody({ type: ReactEvangelismNoteDto })
  async reactNote(@CurrentUser() user: AuthUser, @Param('noteId') noteId: string, @Body() body: ReactEvangelismNoteDto) {
    return this.notes.react(await this.access.viewer(user), noteId, body.emoji);
  }

  @Patch('notes/:noteId')
  @ApiOperation({ summary: 'Edit your own feedback message' })
  @ApiBody({ type: EditEvangelismNoteDto })
  async editNote(@CurrentUser() user: AuthUser, @Param('noteId') noteId: string, @Body() body: EditEvangelismNoteDto) {
    return this.notes.edit(await this.access.viewer(user), noteId, body.body);
  }

  @Delete('notes/:noteId')
  @ApiOperation({ summary: 'Delete a feedback message (yours, or any if you lead)' })
  async deleteNote(@CurrentUser() user: AuthUser, @Param('noteId') noteId: string) {
    return this.notes.remove(await this.access.viewer(user), noteId);
  }

  private checkKind(kind: string) {
    if (kind !== EVANGELISM_NOTE_KIND) throw new BadRequestException('Unknown thread');
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────

  @Get('tasks')
  @ApiOperation({ summary: 'My tasks, or every task (leaders)' })
  async listTasks(@CurrentUser() user: AuthUser, @Query() q: ListEvangelismTasksQuery) {
    return this.tasks.list(await this.access.viewer(user), q);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create and assign a task (leaders)' })
  @ApiBody({ type: EvangelismTaskDto })
  async createTask(@CurrentUser() user: AuthUser, @Body() body: EvangelismTaskDto) {
    return this.tasks.create(await this.access.leader(user), body);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a task (leaders: anything; assignees: status)' })
  @ApiBody({ type: UpdateEvangelismTaskDto })
  async updateTask(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateEvangelismTaskDto) {
    return this.tasks.update(await this.access.viewer(user), id, body);
  }

  @Post('tasks/:id/notes')
  @ApiOperation({ summary: 'Add a note to a task' })
  @ApiBody({ type: EvangelismTaskNoteDto })
  async addTaskNote(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: EvangelismTaskNoteDto) {
    return this.tasks.addNote(await this.access.viewer(user), id, body);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a task (leaders)' })
  async deleteTask(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.leader(user);
    return this.tasks.remove(id);
  }

  // ── Outreaches ─────────────────────────────────────────────────────────────

  @Get('outreaches')
  @ApiOperation({ summary: 'Outreaches with totals (also the comparison chart)' })
  async listOutreaches(@CurrentUser() user: AuthUser) {
    await this.access.viewer(user);
    return this.outreaches.list();
  }

  @Get('outreaches/:id')
  @ApiOperation({ summary: 'An outreach: totals, by worker, and its contacts' })
  async getOutreach(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.outreaches.get(await this.access.viewer(user), id);
  }

  @Post('outreaches')
  @ApiOperation({ summary: 'Create an outreach (leaders)' })
  @ApiBody({ type: EvangelismOutreachDto })
  async createOutreach(@CurrentUser() user: AuthUser, @Body() body: EvangelismOutreachDto) {
    return this.outreaches.create(await this.access.leader(user), body);
  }

  @Patch('outreaches/:id')
  @ApiOperation({ summary: 'Edit an outreach (leaders)' })
  @ApiBody({ type: UpdateEvangelismOutreachDto })
  async updateOutreach(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateEvangelismOutreachDto) {
    return this.outreaches.update(await this.access.leader(user), id, body);
  }

  @Delete('outreaches/:id')
  @ApiOperation({ summary: 'Delete an outreach; its contacts become personal evangelism (leaders)' })
  async deleteOutreach(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.leader(user);
    return this.outreaches.remove(id);
  }

  // ── Testimonies ────────────────────────────────────────────────────────────

  @Get('testimonies')
  @ApiOperation({ summary: 'Testimonies from the field' })
  async listTestimonies(@CurrentUser() user: AuthUser) {
    await this.access.viewer(user);
    return this.testimonies.list();
  }

  @Post('testimonies')
  @ApiOperation({ summary: 'Record a testimony' })
  @ApiBody({ type: EvangelismTestimonyDto })
  async createTestimony(@CurrentUser() user: AuthUser, @Body() body: EvangelismTestimonyDto) {
    return this.testimonies.create(await this.access.viewer(user), body);
  }

  @Patch('testimonies/:id')
  @ApiOperation({ summary: 'Edit a testimony, or approve it to share (leaders)' })
  @ApiBody({ type: UpdateEvangelismTestimonyDto })
  async updateTestimony(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateEvangelismTestimonyDto) {
    return this.testimonies.update(await this.access.viewer(user), id, body);
  }

  @Delete('testimonies/:id')
  @ApiOperation({ summary: 'Delete a testimony (leaders, or whoever recorded it)' })
  async deleteTestimony(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.testimonies.remove(await this.access.viewer(user), id);
  }

  @Post('testimonies/photo')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_PHOTO_BYTES, files: 1 } }))
  @ApiOperation({ summary: 'Upload a testimony photo; returns its URL' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async uploadPhoto(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
  ) {
    await this.access.viewer(user);
    if (!file) throw new BadRequestException('No photo provided');
    if (file.size > MAX_PHOTO_BYTES) throw new BadRequestException('Photo must be under 8 MB');
    if (!PHOTO_MIME.includes(file.mimetype)) throw new BadRequestException('Use a JPG, PNG, WebP or iPhone photo');
    if (!hasValidFileSignature(file)) throw new BadRequestException('That file is not a photo');
    const stored =
      file.mimetype === 'image/heic' || file.mimetype === 'image/heif' ? await this.uploads.convertHeicToJpeg(file) : file;
    return this.uploads.uploadObject(stored, 'evangelism');
  }

  // ── Performance ────────────────────────────────────────────────────────────

  @Get('performance')
  @ApiOperation({ summary: 'Per-worker figures for the leaderboard' })
  async performanceTable(@CurrentUser() user: AuthUser, @Query() q: EvangelismPerformanceQuery) {
    return this.performance.table(await this.access.viewer(user), q.range ?? 'month');
  }
}
