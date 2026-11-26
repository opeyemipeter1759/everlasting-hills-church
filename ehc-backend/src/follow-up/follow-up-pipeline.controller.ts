import { BadRequestException, Controller, Get, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { PipelineRepository } from '../pipeline/pipeline.repository';
import { PIPELINE_STATUSES, type PipelineFilters, type PipelineStatus } from '../pipeline/pipeline.types';
import { PrismaService } from '../prisma/prisma.service';
import { allAnswers, publicAnswers, teamAnswers } from '../visitors/first-timer-answers';
import { ADMIN_PLUS } from './follow-up.types';
import { FollowUpAuthService } from './services/follow-up-auth.service';
import { PhotoUrlService } from './photos/photo-url.service';
import { MyFollowUpService } from './services/my-follow-up.service';

const STAGES = ['UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_REVIEW', 'CONFIRMED', 'REOPENED', 'OPTED_OUT'];

/** Query-string filters, checked: anything not recognised is refused rather than silently ignored. */
export function parsePipelineFilters(q: Record<string, string | undefined>): PipelineFilters {
  const status = q.status as PipelineStatus | undefined;
  if (status && !PIPELINE_STATUSES.includes(status)) throw new BadRequestException('Unknown status');
  if (q.stage && !STAGES.includes(q.stage)) throw new BadRequestException('Unknown stage');
  const year = q.year ? Number(q.year) : undefined;
  const month = q.month ? Number(q.month) : undefined;
  if (year !== undefined && (!Number.isInteger(year) || year < 2000 || year > 2100)) throw new BadRequestException('Bad year');
  if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12 || !year)) throw new BadRequestException('Bad month');
  const sort = q.sort as PipelineFilters['sort'];
  if (sort && !['newest', 'oldest', 'name'].includes(sort)) throw new BadRequestException('Bad sort');
  return {
    status,
    stage: q.stage,
    assigneeId: q.assigneeId || undefined,
    unitId: q.unitId || undefined,
    student: q.student === 'true' ? true : q.student === 'false' ? false : undefined,
    year,
    month,
    search: q.search || undefined,
    notContacted: q.notContacted === 'true',
    integrated: q.integrated === 'true',
    absentFromServiceId: q.absentFrom || undefined,
    presentAtServiceId: q.presentAt || undefined,
    possibleReturn: q.possibleReturn === 'true',
    take: q.take ? Number(q.take) : undefined,
    skip: q.skip ? Number(q.skip) : undefined,
    sort,
  };
}

/**
 * The first-timer pipeline: people with the counts beside them, and the year
 * at a glance. Everyone who can open the Follow Up page can read it, and so
 * can the first-timer contact.
 */
@ApiTags('follow-up')
@Controller('follow-up')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class FollowUpPipelineController {
  constructor(
    private readonly pipeline: PipelineRepository,
    private readonly auth: FollowUpAuthService,
    private readonly prisma: PrismaService,
    private readonly photos: PhotoUrlService,
    private readonly myFollowUp: MyFollowUpService,
  ) {}

  @Get('my-activity')
  @ApiOperation({ summary: "The caller's own follow-up: who they have, and what they have logged this month and in all" })
  async myActivity(@CurrentUser() actor: AuthUser) {
    await this.auth.requireAccess(actor);
    return this.myFollowUp.activity(actor);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'First-timers and the status counts beside them, under the same filters' })
  @ApiQuery({ name: 'status', required: false, enum: PIPELINE_STATUSES })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'assigneeId', required: false, description: 'A member id, or "none"' })
  @ApiQuery({ name: 'notContacted', required: false })
  @ApiQuery({ name: 'integrated', required: false, description: 'true: only integrated members (and any since marked Away)' })
  @ApiQuery({ name: 'absentFrom', required: false, description: 'A service id: who missed it' })
  @ApiQuery({ name: 'presentAt', required: false, description: 'A service id: who came' })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  async people(@CurrentUser() actor: AuthUser, @Query() query: Record<string, string | undefined>) {
    await this.auth.requireAccess(actor);
    const page = await this.pipeline.list(parsePipelineFilters(query));
    // Only keys from rows this tenant's own query returned are signed, the whole page in one call.
    return { ...page, rows: await this.photos.attach(page.rows) };
  }

  @Get('overview/:year')
  @ApiOperation({ summary: 'The year at a glance: twelve months and their total' })
  async year(@CurrentUser() actor: AuthUser, @Param('year', ParseIntPipe) year: number) {
    await this.auth.requireAccess(actor);
    if (year < 2000 || year > 2100) throw new BadRequestException('Bad year');
    return this.pipeline.year(year);
  }

  @Get('overview/:year/:month/breakdowns')
  @ApiOperation({ summary: 'How one month heard about the church, and who has them' })
  async breakdowns(
    @CurrentUser() actor: AuthUser,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    await this.auth.requireAccess(actor);
    return this.pipeline.breakdowns(parsePipelineFilters({ year: String(year), month: String(month) }));
  }

  @Get('first-timers/:visitorId')
  @ApiOperation({ summary: 'One first-timer: where they stand, and their answers (the prayer request for pastors and admins only; profile only)' })
  async person(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    await this.auth.requireAccess(actor);
    // The pipeline is tenant-scoped and leaves out archived forms, so finding them there is the check.
    const person = await this.pipeline.one(visitorId);
    const visitor = person ? await this.prisma.visitor.findUnique({ where: { id: visitorId } }) : null;
    if (!person || !visitor) throw new NotFoundException('First-timer not found');
    const [withPhoto] = await this.photos.attach([person]);
    const readsPrayer = actor.effectiveRoles?.some((r) => ADMIN_PLUS.includes(r)) ?? false;
    return { person: withPhoto, answers: readsPrayer ? allAnswers(visitor) : teamAnswers(visitor) };
  }

  @Get('first-timers/:visitorId/answers')
  @ApiOperation({ summary: 'A first-timer form answers without the pastoral ones, for lists and the Overview' })
  async answers(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    await this.auth.requireAccess(actor);
    const person = await this.pipeline.one(visitorId);
    const visitor = person ? await this.prisma.visitor.findUnique({ where: { id: visitorId } }) : null;
    if (!visitor) throw new NotFoundException('First-timer not found');
    return publicAnswers(visitor);
  }
}
