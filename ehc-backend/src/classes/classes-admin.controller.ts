import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MembershipApprovalStatus, MembershipStatus, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { ClassesAdminService } from './classes-admin.service';
import { ClassApplicationsService } from './class-applications.service';
import { MembershipService } from './membership.service';
import {
  CohortDto,
  DecisionDto,
  ExceptionEnrollDto,
  LessonContentDto,
  MemberRefDto,
  MembershipStatusDto,
  QuizDto,
  SessionDto,
  SessionMarkDto,
  UpdateCohortDto,
  VerifyDto,
} from './dto/classes.dto';

/**
 * Running the classes and membership. Most routes are for pastors and admins
 * (checked in the services). A facilitator reaches the roster, session
 * attendance and action verification for the cohorts they facilitate, which is
 * why the controller itself is open to members.
 */
@ApiTags('classes')
@ApiBearerAuth('access-token')
@Controller('class-admin')
@Roles(Role.MEMBER)
export class ClassesAdminController {
  constructor(
    private readonly admin: ClassesAdminService,
    private readonly membership: MembershipService,
    private readonly applicationsService: ClassApplicationsService,
  ) {}

  @Get('classes')
  @ApiOperation({ summary: 'The classes, with lesson, cohort and learner counts (staff)' })
  classes(@CurrentUser() actor: AuthUser) {
    return this.admin.classes(actor);
  }

  @Get('classes/:courseId/content')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Every lesson with its content and quiz answers, for editing (staff)' })
  content(@CurrentUser() actor: AuthUser, @Param('courseId') courseId: string) {
    return this.admin.content(actor, courseId);
  }

  @Patch('lessons/:lessonId')
  @ApiOperation({ summary: 'Edit a lesson: outcome, video, scriptures, summary, reflection, action step (staff)' })
  @ApiBody({ type: LessonContentDto })
  updateLesson(@CurrentUser() actor: AuthUser, @Param('lessonId') lessonId: string, @Body() body: LessonContentDto) {
    return this.admin.updateLesson(actor, lessonId, body);
  }

  @Put('lessons/:lessonId/quiz')
  @ApiOperation({ summary: "Replace a lesson's quiz (staff)" })
  @ApiBody({ type: QuizDto })
  setQuiz(@CurrentUser() actor: AuthUser, @Param('lessonId') lessonId: string, @Body() body: QuizDto) {
    return this.admin.setQuiz(actor, lessonId, body.items);
  }

  @Get('classes/:courseId/cohorts')
  @ApiOperation({ summary: 'Cohorts of a class with sessions and facilitators (staff)' })
  cohorts(@CurrentUser() actor: AuthUser, @Param('courseId') courseId: string) {
    return this.admin.cohorts(actor, courseId);
  }

  @Post('classes/:courseId/cohorts')
  @ApiOperation({ summary: 'Start a cohort (staff)' })
  @ApiBody({ type: CohortDto })
  createCohort(@CurrentUser() actor: AuthUser, @Param('courseId') courseId: string, @Body() body: CohortDto) {
    return this.admin.createCohort(actor, courseId, body);
  }

  @Patch('cohorts/:cohortId')
  @ApiOperation({ summary: 'Edit or close a cohort (staff)' })
  @ApiBody({ type: UpdateCohortDto })
  updateCohort(@CurrentUser() actor: AuthUser, @Param('cohortId') cohortId: string, @Body() body: UpdateCohortDto) {
    return this.admin.updateCohort(actor, cohortId, body);
  }

  @Post('cohorts/:cohortId/sessions')
  @ApiOperation({ summary: 'Add an in-person session (staff)' })
  @ApiBody({ type: SessionDto })
  addSession(@CurrentUser() actor: AuthUser, @Param('cohortId') cohortId: string, @Body() body: SessionDto) {
    return this.admin.addSession(actor, cohortId, body);
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Remove a session (staff)' })
  removeSession(@CurrentUser() actor: AuthUser, @Param('sessionId') sessionId: string) {
    return this.admin.removeSession(actor, sessionId);
  }

  @Post('cohorts/:cohortId/facilitators')
  @ApiOperation({ summary: 'Add a facilitator to a cohort (staff)' })
  @ApiBody({ type: MemberRefDto })
  addFacilitator(@CurrentUser() actor: AuthUser, @Param('cohortId') cohortId: string, @Body() body: MemberRefDto) {
    return this.admin.addFacilitator(actor, cohortId, body.memberId);
  }

  @Delete('cohorts/:cohortId/facilitators/:memberId')
  @ApiOperation({ summary: 'Remove a facilitator (staff)' })
  removeFacilitator(@CurrentUser() actor: AuthUser, @Param('cohortId') cohortId: string, @Param('memberId') memberId: string) {
    return this.admin.removeFacilitator(actor, cohortId, memberId);
  }

  @Get('cohorts/:cohortId/roster')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Learners with progress, sessions and action steps (staff or the cohort facilitator)' })
  roster(@CurrentUser() actor: AuthUser, @Param('cohortId') cohortId: string) {
    return this.admin.roster(actor, cohortId);
  }

  @Put('sessions/:sessionId/attendance')
  @ApiOperation({ summary: 'Mark a learner present or absent at a session (staff or facilitator)' })
  @ApiBody({ type: SessionMarkDto })
  markSession(@CurrentUser() actor: AuthUser, @Param('sessionId') sessionId: string, @Body() body: SessionMarkDto) {
    return this.admin.markSession(actor, sessionId, body.memberId, body.present);
  }

  @Put('actions/:actionId/verify')
  @ApiOperation({ summary: 'Verify a learner action step (staff or facilitator)' })
  @ApiBody({ type: VerifyDto })
  verify(@CurrentUser() actor: AuthUser, @Param('actionId') actionId: string, @Body() body: VerifyDto) {
    return this.admin.verifyAction(actor, actionId, body.verified);
  }

  @Post('enroll')
  @ApiOperation({ summary: 'Enroll a member past the eligibility rule, with a reason (staff)' })
  @ApiBody({ type: ExceptionEnrollDto })
  enroll(@CurrentUser() actor: AuthUser, @Body() body: ExceptionEnrollDto) {
    return this.admin.enrollByException(actor, body);
  }

  @Get('stalled')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Learners with no progress for three weeks (staff)' })
  stalled(@CurrentUser() actor: AuthUser) {
    return this.admin.stalled(actor);
  }

  @Get('applications')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Applications to join a class (Super Admin, Pastor or Admin Head)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'DECLINED'] })
  applications(@CurrentUser() actor: AuthUser, @Query('status') status?: string) {
    const s = (['PENDING', 'APPROVED', 'DECLINED'] as const).find((x) => x === status) ?? 'PENDING';
    return this.applicationsService.list(actor, s);
  }

  @Post('applications/:id/approve')
  @ApiOperation({ summary: 'Approve an application to join a class' })
  @ApiBody({ type: DecisionDto })
  approveApplication(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: DecisionDto) {
    return this.applicationsService.decide(actor, id, true, body.note);
  }

  @Post('applications/:id/decline')
  @ApiOperation({ summary: 'Decline an application to join a class, with a note the member sees' })
  @ApiBody({ type: DecisionDto })
  declineApplication(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: DecisionDto) {
    return this.applicationsService.decide(actor, id, false, body.note);
  }

  @Get('approvals')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Ready-for-membership items (Pastor or Admin)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'DECLINED'] })
  approvals(@CurrentUser() actor: AuthUser, @Query('status') status?: string) {
    const s = (['PENDING', 'CONFIRMED', 'DECLINED'] as const).find((x) => x === status) ?? 'PENDING';
    return this.membership.listApprovals(actor, MembershipApprovalStatus[s]);
  }

  @Post('approvals/:id/confirm')
  @ApiOperation({ summary: 'Confirm full membership (Pastor or Admin)' })
  @ApiBody({ type: DecisionDto })
  confirm(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: DecisionDto) {
    return this.membership.decide(actor, id, true, body.note);
  }

  @Post('approvals/:id/decline')
  @ApiOperation({ summary: 'Decline for now, with a note (Pastor or Admin)' })
  @ApiBody({ type: DecisionDto })
  decline(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: DecisionDto) {
    return this.membership.decide(actor, id, false, body.note);
  }

  @Put('members/:memberId/membership')
  @ApiOperation({ summary: 'Set membership status directly, with a reason kept on record (Pastor or Admin)' })
  @ApiBody({ type: MembershipStatusDto })
  setMembership(@CurrentUser() actor: AuthUser, @Param('memberId') memberId: string, @Body() body: MembershipStatusDto) {
    return this.membership.setStatus(actor, memberId, MembershipStatus[body.status], body.reason);
  }

  @Get('members/:memberId/membership')
  @ApiOperation({ summary: "A member's membership status and its changes (staff)" })
  history(@CurrentUser() actor: AuthUser, @Param('memberId') memberId: string) {
    return this.membership.history(actor, memberId);
  }
}
