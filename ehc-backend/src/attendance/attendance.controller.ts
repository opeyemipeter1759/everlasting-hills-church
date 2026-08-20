import { Body, Controller, Get, Param, Patch, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiBody,
  ApiExtension,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import type { ListAttendanceQuery } from './attendance.types';
import { BulkMarkAttendanceDto } from './dto/bulk-mark-attendance.dto';
import { OverrideAttendanceDto } from './dto/override-attendance.dto';
import { AttendanceFeedService } from './services/attendance-feed.service';
import { AttendanceExportService } from './services/attendance-export.service';
import { AttendanceListService } from './services/attendance-list.service';
import { AttendanceOverrideService } from './services/attendance-override.service';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Attendance module — list/export/feed/override.
 *
 * Authentication: global JwtAuthGuard. Authorization: declared per-route via @Roles.
 * Onboarding-adjacent routes (check-in, me/*, can-mark) live in
 * AttendanceSelfServiceController; service session CRUD in ServiceSessionController;
 * dashboard chart data in AttendanceStatsController — all registered alongside this
 * one in attendance.module.ts. No catch-all `:id` route exists here, so registration
 * order across these controllers doesn't matter.
 */
@ApiTags('attendance')
@Controller('attendance')
@ApiBearerAuth('access-token')
export class AttendanceController {
  constructor(
    private readonly feed: AttendanceFeedService,
    private readonly exportSvc: AttendanceExportService,
    private readonly listService: AttendanceListService,
    private readonly override: AttendanceOverrideService,
  ) {}

  /** GET /attendance/feed/today — declared before :sessionId routes to avoid conflict */
  @Get('feed/today')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Today's live check-in feed (ADMIN+). Poll every 30s." })
  getTodayFeed() {
    return this.feed.getTodayFeed();
  }

  /** GET /attendance/export — Excel file download */
  @Get('export')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Export attendance as Excel (ADMIN+)' })
  @ApiExtension('x-response-envelope', false)
  @ApiProduces(XLSX_MIME)
  @ApiOkResponse({
    description: 'Excel workbook',
    content: { [XLSX_MIME]: { schema: { type: 'string', format: 'binary' } } },
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PRESENT', 'ABSENT'] })
  @ApiQuery({ name: 'serviceKey', required: false })
  @ApiQuery({ name: 'month', required: false, example: '2026-06' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async exportCsv(
    @Query() q: Omit<ListAttendanceQuery, 'page' | 'limit'>,
    @Res() res: Response,
  ) {
    const buffer = await this.exportSvc.exportAttendanceCsv(q);
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-export.xlsx"');
    res.send(buffer);
  }

  /** GET /attendance — list with filters, sort, pagination */
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Paginated attendance list with filters and sorting (ADMIN+)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PRESENT', 'ABSENT'] })
  @ApiQuery({ name: 'serviceKey', required: false, enum: ['sunday', 'wednesday'] })
  @ApiQuery({ name: 'year', required: false, example: '2026' })
  @ApiQuery({ name: 'month', required: false, example: '2026-06' })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-19' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['date', 'name', 'status', 'markedAt', 'serviceKey'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  listAttendance(@Query() q: ListAttendanceQuery) {
    return this.listService.listAttendance(q);
  }

  /** PATCH /attendance/session/:sessionId/member/:userId — inline status override */
  @Patch('session/:sessionId/member/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Override a single member attendance status (ADMIN+)' })
  @ApiParam({ name: 'sessionId', description: 'Service / session ID' })
  @ApiParam({ name: 'userId', description: 'Member ID' })
  @ApiBody({ type: OverrideAttendanceDto })
  @ApiOkResponse({
    description: 'Updated attendance record',
    schema: {
      example: { id: 'rec-1', status: 'PRESENT', markedBy: 'ADMIN', markedAt: '2026-06-19T09:00:00.000Z' },
    },
  })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  overrideAttendance(
    @Param('sessionId') sessionId: string,
    @Param('userId') userId: string,
    @Body() dto: OverrideAttendanceDto,
  ) {
    return this.override.overrideAttendance(sessionId, userId, dto.status);
  }

  /** PATCH /attendance/session/:sessionId/bulk — bulk mark */
  @Patch('session/:sessionId/bulk')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Bulk mark attendance PRESENT or ABSENT (ADMIN+)' })
  @ApiParam({ name: 'sessionId', description: 'Service / session ID' })
  @ApiBody({ type: BulkMarkAttendanceDto })
  @ApiOkResponse({
    description: 'Number of records updated',
    schema: { example: { updated: 12 } },
  })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  bulkMark(
    @Param('sessionId') sessionId: string,
    @Body() dto: BulkMarkAttendanceDto,
  ) {
    return this.override.bulkMarkAttendance(sessionId, dto.userIds, dto.status);
  }
}
