import { Body, Controller, Get, Header, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { ClassesLearnerService } from './classes-learner.service';
import { ClassesAdminService } from './classes-admin.service';
import { ClassWatchService } from './class-watch.service';
import { HeartbeatDto, QuizAnswersDto, StartWatchDto, SummaryDto } from './dto/classes.dto';

/**
 * The church's classes, for the signed-in learner: the Membership Class and the
 * others. Access to a class comes from an enrollment row, not from a role.
 */
@ApiTags('classes')
@ApiBearerAuth('access-token')
@Controller('classes')
@Roles(Role.MEMBER)
export class ClassesController {
  constructor(
    private readonly learner: ClassesLearnerService,
    private readonly admin: ClassesAdminService,
    private readonly watch: ClassWatchService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Every class, with my eligibility and progress in each' })
  list(@CurrentUser() actor: AuthUser) {
    return this.learner.list(actor);
  }

  // Declared before :slug, which would otherwise take "facilitating" as a class.
  @Get('facilitating')
  @ApiOperation({ summary: 'The cohorts I facilitate' })
  facilitating(@CurrentUser() actor: AuthUser) {
    return this.admin.facilitating(actor);
  }

  @Get(':slug')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'A class home: outline with lesson statuses, progress, next session, action checklist' })
  home(@CurrentUser() actor: AuthUser, @Param('slug') slug: string) {
    return this.learner.home(actor, slug);
  }

  @Get(':slug/status')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'My eligibility and progress, for the public class page buttons' })
  status(@CurrentUser() actor: AuthUser, @Param('slug') slug: string) {
    return this.learner.status(actor, slug);
  }

  @Post(':slug/enroll')
  @ApiOperation({ summary: 'Enroll in a class: placed in the current cohort if eligible, otherwise the next one after eligibility' })
  enroll(@CurrentUser() actor: AuthUser, @Param('slug') slug: string) {
    return this.learner.enroll(actor, slug);
  }

  @Get(':slug/certificate')
  @ApiOperation({ summary: 'My certificate, once the class is complete' })
  certificate(@CurrentUser() actor: AuthUser, @Param('slug') slug: string) {
    return this.learner.certificate(actor, slug);
  }

  @Get(':slug/lessons/:lesson')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'A lesson, with my progress in it. Quiz answers are never included.' })
  lesson(@CurrentUser() actor: AuthUser, @Param('slug') slug: string, @Param('lesson') lesson: string) {
    return this.learner.lesson(actor, slug, lesson);
  }

  @Post(':slug/lessons/:lesson/watch-sessions')
  @ApiOperation({ summary: 'Start watching the lesson video. The server, not the browser, decides when it counts as watched.' })
  @ApiBody({ type: StartWatchDto })
  startWatching(@CurrentUser() actor: AuthUser, @Param('slug') slug: string, @Param('lesson') lesson: string, @Body() body: StartWatchDto) {
    return this.watch.start(actor, slug, lesson, body?.position);
  }

  @Put(':slug/lessons/:lesson/watch-sessions/:sessionId/heartbeat')
  @ApiOperation({ summary: 'Report the player position while watching' })
  @ApiBody({ type: HeartbeatDto })
  heartbeat(
    @CurrentUser() actor: AuthUser,
    @Param('slug') slug: string,
    @Param('lesson') lesson: string,
    @Param('sessionId') sessionId: string,
    @Body() body: HeartbeatDto,
  ) {
    return this.watch.heartbeat(actor, slug, lesson, sessionId, body.position);
  }

  @Post(':slug/lessons/:lesson/quiz')
  @ApiOperation({ summary: 'Submit the quiz; graded on the server' })
  @ApiBody({ type: QuizAnswersDto })
  quiz(@CurrentUser() actor: AuthUser, @Param('slug') slug: string, @Param('lesson') lesson: string, @Body() body: QuizAnswersDto) {
    return this.learner.submitQuiz(actor, slug, lesson, body.answers);
  }

  @Post(':slug/lessons/:lesson/summary')
  @ApiOperation({ summary: 'Save my private summary of the lesson. 409 until the video has been watched.' })
  @ApiBody({ type: SummaryDto })
  summary(@CurrentUser() actor: AuthUser, @Param('slug') slug: string, @Param('lesson') lesson: string, @Body() body: SummaryDto) {
    return this.learner.saveSummary(actor, slug, lesson, body.text);
  }
}
