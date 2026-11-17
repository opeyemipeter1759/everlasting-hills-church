import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { FollowUpAuthService } from '../services/follow-up-auth.service';
import { FirstTimerVisitsService } from './first-timer-visits.service';
import { PossibleReturnService } from './possible-return.service';
import { cameAgainSchema, firstVisitSchema } from './visit-day.schema';

/**
 * A first-timer's visits ("Came again", undo, the first visit date) and the
 * possible return visit flag. Open to everyone who can read the pipeline.
 */
@ApiTags('follow-up')
@Controller('follow-up/first-timers/:visitorId')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class FirstTimerVisitsController {
  constructor(
    private readonly visits: FirstTimerVisitsService,
    private readonly returns: PossibleReturnService,
    private readonly auth: FollowUpAuthService,
  ) {}

  @Get('visits')
  @ApiOperation({ summary: 'Their visits, how each was recorded, and the latest service day' })
  async list(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    await this.auth.requireAccess(actor);
    return this.visits.list(visitorId);
  }

  @Post('visits')
  @ApiOperation({ summary: 'Came again: a visit on a Lagos date (default: the latest service held). The same date twice is one visit.' })
  async cameAgain(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string, @Body() body: unknown) {
    await this.auth.requireAccess(actor);
    return this.visits.cameAgain(actor, visitorId, parseSchema(cameAgainSchema, body ?? {}).date);
  }

  @Delete('visits/:date')
  @ApiOperation({ summary: 'Undo a Came again visit. The first visit is never removed.' })
  async undo(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string, @Param('date') date: string) {
    await this.auth.requireAccess(actor);
    return this.visits.undo(actor, visitorId, date);
  }

  @Patch('first-visit')
  @ApiOperation({ summary: 'Correct their first visit date, and the month they count in' })
  async firstVisit(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string, @Body() body: unknown) {
    await this.auth.requireAccess(actor);
    return this.visits.correctFirstVisit(actor, visitorId, parseSchema(firstVisitSchema, body).date);
  }

  @Get('possible-return')
  @ApiOperation({ summary: 'Who a form flagged as a possible return visit may be' })
  async possibleReturn(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    await this.auth.requireAccess(actor);
    return this.returns.match(visitorId);
  }

  @Post('possible-return/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Same person: a return visit on the original record, and this form archived. Never merges.' })
  async confirm(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    await this.auth.requireAccess(actor);
    return this.returns.confirm(actor, visitorId);
  }

  @Post('possible-return/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Different person: clear the flag and keep both records' })
  async dismiss(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    await this.auth.requireAccess(actor);
    return this.returns.dismiss(actor, visitorId);
  }
}
