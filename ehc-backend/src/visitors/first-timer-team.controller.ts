import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { PipelineRepository } from '../pipeline/pipeline.repository';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { VisitorsService } from './visitors.service';
import { parseFirstTimerFilters } from './visitors.controller';
import { FirstTimerTeamAccess, withoutPrayer } from './first-timer-team.access';

/**
 * The First Timer Team's view of the first-timer records: the admin First
 * Timers list, with the same filters and counts, minus the prayer request.
 * The team may correct a record; archiving and making accounts stay with the
 * admins. MEMBER is only the floor: FirstTimerTeamAccess decides.
 */
@ApiTags('first-timer-team')
@Controller('first-timer-team')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class FirstTimerTeamController {
  constructor(
    private readonly visitors: VisitorsService,
    private readonly pipeline: PipelineRepository,
    private readonly access: FirstTimerTeamAccess,
  ) {}

  @Get('first-timers')
  @ApiOperation({ summary: 'A page of first-timer forms with the counts beside it, without prayer requests (First Timer Team)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'interest', required: false, enum: ['yes', 'no'] })
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD, the day the form came in' })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  async list(@CurrentUser() actor: AuthUser, @Query() query: Record<string, string | undefined>) {
    await this.access.require(actor);
    const filters = parseFirstTimerFilters(query);
    const [page, pipeline, canEdit] = await Promise.all([
      this.visitors.firstTimers(filters),
      this.pipeline.list({ year: filters.year, month: filters.month, take: 1 }),
      this.access.canEdit(actor),
    ]);
    // canEdit: whether this viewer may correct records, so the page offers Edit only to them.
    return { ...page, rows: page.rows.map((row) => withoutPrayer(row)), onRecord: pipeline.counts.all, canEdit };
  }

  @Patch('first-timers/:id')
  @ApiOperation({ summary: "Correct a first-timer record; the prayer request is not editable here (the First Timer Team's lead, its head of department, or an admin)" })
  @ApiBody({ type: UpdateVisitorDto })
  async update(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: UpdateVisitorDto) {
    await this.access.requireEdit(actor);
    const { prayerPoint: _prayer, ...edit } = body;
    void _prayer;
    return withoutPrayer(await this.visitors.update(id, edit as UpdateVisitorDto));
  }
}
