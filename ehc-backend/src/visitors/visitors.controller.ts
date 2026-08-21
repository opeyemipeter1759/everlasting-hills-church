import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { VisitorsService } from './visitors.service';
import { VisitorBulkImportService } from './services/visitor-bulk-import.service';
import { BulkImportVisitorsDto } from './dto/bulk-import-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';

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

  @Get('count')
  @ApiOperation({ summary: 'Total visitor count' })
  @ApiOkResponse({ description: 'Total visitors for this tenant' })
  async count() {
    return { count: await this.visitorsService.count() };
  }

  // Declared before :id — a literal segment route below a wildcard :id route
  // would otherwise be swallowed by getById("stats").
  @Get('stats')
  @ApiOperation({ summary: 'First-timer count broken down by attendance type' })
  @ApiOkResponse({ description: '{ total, onsite, online }' })
  async stats() {
    return this.visitorsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visitor by id' })
  async getById(@Param('id') id: string) {
    return this.visitorsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a visitor record (e.g. correct a name or phone number)' })
  @ApiBody({ type: UpdateVisitorDto })
  async update(@Param('id') id: string, @Body() body: UpdateVisitorDto) {
    return this.visitorsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a visitor record' })
  async delete(@Param('id') id: string) {
    return this.visitorsService.delete(id);
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
