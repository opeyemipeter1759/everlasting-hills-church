import { Body, Controller, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AttendanceService, type ListAttendanceQuery } from './attendance.service';
import { BulkMarkAttendanceDto } from './dto/bulk-mark-attendance.dto';
import { OverrideAttendanceDto } from './dto/override-attendance.dto';
import { CreateServiceDto } from './dto/create-service.dto';

/**
 * Attendance module.
 *
 * Authentication: global JwtAuthGuard. Authorization: declared per-route via @Roles
 * for admin endpoints. Member self-service routes (check-in, /me) are auth-required but
 * available to any role. The previous code did inline `profile.role in ADMIN_ROLES` checks;
 * those are now declarative via @Roles + RolesGuard.
 *
 * The current user's profileId comes from the JWT-resolved AuthUser (no extra DB query).
 */
@ApiTags('attendance')
@Controller('attendance')
@ApiBearerAuth('access-token')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ── Member self-service ─────────────────────────────────────────────────────

  @Post('check-in')
  @ApiOperation({ summary: 'Check in for today service' })
  @ApiOkResponse({
    description: 'Current user checked in for today service',
    schema: {
      example: {
        alreadyCheckedIn: false,
        service: { id: 'service-123', name: 'Sunday Service', scheduledAt: '2026-05-26T00:00:00.000Z' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token missing or invalid' })
  async checkIn(@CurrentUser() user: AuthUser) {
    // Pass the Supabase userId — the service looks up Profile by `userId` column
    // and auto-provisions a Member row if the user has a Profile but no Member.
    return this.attendanceService.checkIn(user.userId, user.email);
  }

  @Post('services/:serviceId/check-in')
  @ApiOperation({ summary: 'Check in for a specific service' })
  async checkInByServiceId(
    @CurrentUser() user: AuthUser,
    @Param('serviceId') serviceId: string,
  ) {
    return this.attendanceService.checkInByServiceId(user.userId, serviceId, user.email);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current member attendance history' })
  async getMyAttendance(@CurrentUser() user: AuthUser) {
    return this.attendanceService.getMemberAttendance(user.userId);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Per-service present/absent tracking for the current member' })
  async getMyHistory(@CurrentUser() user: AuthUser) {
    return this.attendanceService.getMemberHistory(user.userId);
  }

  @Get('can-mark')
  @ApiOperation({ summary: 'Check whether the current user can mark attendance now' })
  @ApiOkResponse({
    description: 'Whether the user can mark attendance for the active session',
    schema: {
      examples: {
        canMark: { value: { canMark: true } },
        noSession: { value: { canMark: false, reason: 'NO_OPEN_SESSION' } },
        alreadyMarked: { value: { canMark: false, reason: 'ALREADY_MARKED' } },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token missing or invalid' })
  async canMark(@CurrentUser() user: AuthUser) {
    return this.attendanceService.canMark(user.userId);
  }

  // ── Admin endpoints (ADMIN+) ────────────────────────────────────────────────

  @Get('today')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get today service attendance with members (ADMIN+)' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getTodayAttendance() {
    return this.attendanceService.getTodayAttendanceWithMembers();
  }

  @Get('services')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get services with attendance counts (ADMIN+)' })
  async getServices() {
    return this.attendanceService.getAllServicesWithCounts();
  }

  @Post('services')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a service session (ADMIN+)' })
  async createService(@Body() body: CreateServiceDto) {
    return this.attendanceService.createService(body);
  }

  @Patch('services/:serviceId/open')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Open a service for check-in (ADMIN+)' })
  async openService(@Param('serviceId') serviceId: string) {
    return this.attendanceService.openService(serviceId);
  }

  @Patch('services/:serviceId/close')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Close a service (ADMIN+)' })
  async closeService(@Param('serviceId') serviceId: string) {
    return this.attendanceService.closeService(serviceId);
  }

  @Get('services/:serviceId/export')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Export a service attendance as CSV (ADMIN+)' })
  async exportService(@Param('serviceId') serviceId: string) {
    return this.attendanceService.exportServiceCsv(serviceId);
  }

  /**
   * Next-service is read by both the admin dashboard and the UNIT_LEAD dashboard, so it's
   * accessible to any authenticated user — not gated to ADMIN.
   */
  @Get('services/next')
  @ApiOperation({ summary: 'Get next scheduled service' })
  async getNextService() {
    return this.attendanceService.getNextService();
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get attendance dashboard stats (ADMIN+)' })
  async getStats() {
    const [totalServices, nextService, recentServices, todayCheckIns] = await Promise.all([
      this.attendanceService.countTotalServices(),
      this.attendanceService.getNextService(),
      this.attendanceService.getRecentServicesStats(),
      this.attendanceService.countTodayCheckIns(),
    ]);
    return { totalServices, nextService, recentServices, todayCheckIns };
  }

  @Get('trend')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get attendance trend (ADMIN+)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAttendanceTrend(@Query('limit') limit?: string) {
    return this.attendanceService.getAttendanceTrend(limit ? Number(limit) : 16);
  }

  @Get('day-of-week')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Attendance by day of week (ADMIN+)' })
  async getAttendanceByDayOfWeek() {
    return this.attendanceService.getAttendanceByDayOfWeek();
  }

  @Get('top-attendees')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Top attendees (ADMIN+)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopAttendees(@Query('limit') limit?: string) {
    return this.attendanceService.getTopAttendees(limit ? Number(limit) : 10);
  }

  @Get('summary')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Attendance summary metrics (ADMIN+)' })
  async getAttendanceSummary() {
    return this.attendanceService.getAttendanceSummary();
  }

  // ── New admin endpoints ────────────────────────────────────────────────────

  /** GET /attendance/feed/today — declared before :sessionId routes to avoid conflict */
  @Get('feed/today')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Today's live check-in feed (ADMIN+). Poll every 30s." })
  getTodayFeed() {
    return this.attendanceService.getTodayFeed();
  }

  /** GET /attendance/export — Excel file download */
  @Get('export')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Export attendance as Excel (ADMIN+)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PRESENT', 'ABSENT'] })
  @ApiQuery({ name: 'serviceKey', required: false })
  @ApiQuery({ name: 'month', required: false, example: '2026-06' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async exportCsv(
    @Query() q: Omit<ListAttendanceQuery, 'page' | 'limit'>,
    @Res() res: Response,
  ) {
    const buffer = await this.attendanceService.exportAttendanceCsv(q);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
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
    return this.attendanceService.listAttendance(q);
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
    return this.attendanceService.overrideAttendance(sessionId, userId, dto.status);
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
    return this.attendanceService.bulkMarkAttendance(sessionId, dto.userIds, dto.status);
  }
}
