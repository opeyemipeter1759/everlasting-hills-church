import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { VisitorsService } from './visitors.service';
import { VisitorBulkImportService } from './services/visitor-bulk-import.service';
import { BulkImportVisitorsDto } from './dto/bulk-import-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { WhatsappCommunityDto } from './dto/whatsapp-community.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { PipelineRepository } from '../pipeline/pipeline.repository';
import type { FirstTimerAdminFilters } from './first-timer-admin-list';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The admin First Timers page's query string, checked: a bad value is refused, not ignored. */
export function parseFirstTimerFilters(q: Record<string, string | undefined>): FirstTimerAdminFilters {
  const year = q.year ? Number(q.year) : undefined;
  const month = q.month ? Number(q.month) : undefined;
  if (year !== undefined && (!Number.isInteger(year) || year < 2000 || year > 2100)) throw new BadRequestException('Bad year');
  if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12 || !year)) throw new BadRequestException('Bad month');
  if (q.interest && q.interest !== 'yes' && q.interest !== 'no') throw new BadRequestException('Bad interest');
  for (const day of [q.from, q.to]) if (day && !DAY.test(day)) throw new BadRequestException('Dates are YYYY-MM-DD');
  return {
    search: q.search || undefined,
    interest: (q.interest as FirstTimerAdminFilters['interest']) || undefined,
    from: q.from || undefined,
    to: q.to || undefined,
    year,
    month,
    take: q.take ? Number(q.take) : undefined,
    skip: q.skip ? Number(q.skip) : undefined,
  };
}

/**
 * Admin visitor endpoints. ADMIN+ via class-level @Roles.
 * Visitor *creation* is normally the public POST /forms/register flow — kept separate
 * so spam-tight throttling on the public form doesn't accidentally apply to admin
 * listings. Bulk CSV import (below) is the one admin-side write, for backfilling
 * historical first-timer records collected outside that flow.
 */
@ApiTags('visitors')
@Controller('visitors')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class VisitorsController {
  constructor(
    private readonly visitorsService: VisitorsService,
    private readonly bulkImportService: VisitorBulkImportService,
    private readonly pipeline: PipelineRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List visitors' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiOkResponse({ description: 'Visitor list ordered by submittedAt desc' })
  async list(@Query('limit') limit?: string, @Query('search') search?: string) {
    return this.visitorsService.list({
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  /**
   * The admin First Timers page: a page of forms nobody has made an account
   * from yet, the tab counts beside it, and the cards above it, all counted
   * on the server. `onRecord` is the first-timer pipeline's own total for the
   * same month and year, the figure the Follow Up page shows.
   */
  @Get('first-timers')
  @ApiOperation({ summary: 'A page of first-timer forms with the counts beside it (ADMIN+)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'interest', required: false, enum: ['yes', 'no'] })
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD, the day the form came in' })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  async firstTimers(@Query() query: Record<string, string | undefined>) {
    const filters = parseFirstTimerFilters(query);
    const [page, pipeline] = await Promise.all([
      this.visitorsService.firstTimers(filters),
      this.pipeline.list({ year: filters.year, month: filters.month, take: 1 }),
    ]);
    return { ...page, onRecord: pipeline.counts.all };
  }

  @Get('count')
  @ApiOperation({ summary: 'Total visitor count' })
  @ApiOkResponse({ description: 'Total visitors for this tenant' })
  async count() {
    return { count: await this.visitorsService.count() };
  }

  // Declared before :id — a literal segment route below a wildcard :id route
  // would otherwise be swallowed by getById("stats").
  @Get('whatsapp-community')
  @ApiOperation({
    summary: 'First-timers who asked to join the WhatsApp community, waiting first',
  })
  @ApiQuery({ name: 'includeAdded', required: false, type: Boolean })
  async whatsappCommunity(@Query('includeAdded') includeAdded?: string) {
    return this.visitorsService.whatsappCommunity({
      includeAdded: includeAdded === 'true',
    });
  }

  @Patch(':id/whatsapp-community')
  @ApiOperation({ summary: 'Mark someone added to the WhatsApp community, or undo it' })
  @ApiBody({ type: WhatsappCommunityDto })
  async setWhatsappAdded(
    @Param('id') id: string,
    @Body() body: WhatsappCommunityDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.visitorsService.setWhatsappAdded(id, body.added, actor.profileId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'First-timer count broken down by attendance type' })
  @ApiOkResponse({ description: '{ total, onsite, online }' })
  async stats() {
    return this.visitorsService.getStats();
  }

  // Reading and correcting one first-timer's record is follow-up work, not
  // administration: unit leads and heads of department do it from the Master
  // List. HOD is listed explicitly because the guard treats it as lateral, so
  // it never inherits UNIT_LEAD routes. Archiving a record stays ADMIN+.
  @Get(':id')
  @Roles(Role.UNIT_LEAD, Role.HOD)
  @ApiOperation({ summary: 'Get visitor by id (UNIT_LEAD/HOD+)' })
  async getById(@Param('id') id: string) {
    return this.visitorsService.getById(id);
  }

  @Patch(':id')
  @Roles(Role.UNIT_LEAD, Role.HOD)
  @ApiOperation({ summary: 'Edit a visitor record, e.g. correct a name or phone number (UNIT_LEAD/HOD+)' })
  @ApiBody({ type: UpdateVisitorDto })
  async update(@Param('id') id: string, @Body() body: UpdateVisitorDto) {
    return this.visitorsService.update(id, body);
  }

  /**
   * First-timers are never deleted. DELETE archives the record: it drops out
   * of every list and count, the Follow Up conversation and history stay, and
   * an audit row records who did it. Admin, Admin Head, Pastor and Super Admin
   * only (the class-level ADMIN gate); the follow-up team gets 403.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Archive a first-timer record; nothing is deleted (ADMIN+)' })
  async archive(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.visitorsService.archive(id, actor);
  }

  @Post('import')
  @ApiOperation({ summary: 'Bulk-import visitors from parsed CSV rows' })
  @ApiBody({ type: BulkImportVisitorsDto })
  async bulkImport(@Body() body: BulkImportVisitorsDto) {
    return this.bulkImportService.bulkImport(body.rows, {
      sendWelcome: body.sendWelcome,
      alsoWelcomeExisting: body.alsoWelcomeExisting,
    });
  }
}
