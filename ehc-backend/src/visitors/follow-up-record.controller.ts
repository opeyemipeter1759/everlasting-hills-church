import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { PipelineRepository } from '../pipeline/pipeline.repository';
import { FollowUpAuthService } from '../follow-up/services/follow-up-auth.service';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { VisitorsService } from './visitors.service';
import { withoutPrayer } from './first-timer-team.access';

/**
 * A first-timer's record, read and corrected from their Follow-Up profile.
 * Whoever may see them reads it; a Follow-Up team member edits only the
 * first-timers assigned to them, and the lead, heads of department and admins
 * edit anyone. The prayer request is never read or written here.
 */
@ApiTags('follow-up')
@Controller('follow-up/first-timers')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class FollowUpRecordController {
  constructor(
    private readonly visitors: VisitorsService,
    private readonly pipeline: PipelineRepository,
    private readonly auth: FollowUpAuthService,
  ) {}

  /** Their pipeline row, once the viewer is cleared to see them at all. */
  private async allowedToSee(actor: AuthUser, visitorId: string) {
    await this.auth.requireAccess(actor);
    const person = await this.pipeline.one(visitorId);
    if (!person) throw new NotFoundException('First-timer not found');
    const own = await this.auth.firstTimerScope(actor);
    if (own && person.assigneeId !== own) throw new ForbiddenException('This first-timer is not assigned to you');
    return person;
  }

  @Get(':visitorId/record')
  @ApiOperation({ summary: "A first-timer's record without the prayer request, and whether the viewer may edit it" })
  async record(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    const person = await this.allowedToSee(actor, visitorId);
    const [visitor, canEdit] = await Promise.all([this.visitors.getById(visitorId), this.auth.canEditRecord(actor, person.assigneeId)]);
    return { record: withoutPrayer(visitor), canEdit };
  }

  @Patch(':visitorId/record')
  @ApiOperation({ summary: "Correct a first-timer's record (their assignee, the Follow-Up lead, heads of department, admins)" })
  @ApiBody({ type: UpdateVisitorDto })
  async update(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string, @Body() body: UpdateVisitorDto) {
    const person = await this.allowedToSee(actor, visitorId);
    if (!(await this.auth.canEditRecord(actor, person.assigneeId))) {
      throw new ForbiddenException('You can only edit the first-timers assigned to you');
    }
    const { prayerPoint: _prayer, ...edit } = body;
    void _prayer;
    return withoutPrayer(await this.visitors.update(visitorId, edit as UpdateVisitorDto));
  }
}
