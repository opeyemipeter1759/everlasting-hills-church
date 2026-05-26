import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AttendanceService } from './attendance.service';

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
    if (!user.profileId) {
      throw new Error('No profile associated with this user');
    }
    return this.attendanceService.checkIn(user.profileId);
  }

  @Post('services/:serviceId/check-in')
  @ApiOperation({ summary: 'Check in for a specific service' })
  async checkInByServiceId(
    @CurrentUser() user: AuthUser,
    @Param('serviceId') serviceId: string,
  ) {
    if (!user.profileId) {
      throw new Error('No profile associated with this user');
    }
    return this.attendanceService.checkInByServiceId(user.profileId, serviceId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current member attendance history' })
  async getMyAttendance(@CurrentUser() user: AuthUser) {
    if (!user.profileId) return [];
    return this.attendanceService.getMemberAttendance(user.profileId);
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
}
