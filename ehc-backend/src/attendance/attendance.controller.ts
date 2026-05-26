import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiQuery,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { AttendanceService } from './attendance.service';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'PASTOR', 'ADMIN']);

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly authService: AuthService,
  ) {}

  private async getCurrentProfile(authorization?: string) {
    const profile = await this.authService.getProfile(authorization);
    return profile;
  }

  private getAuthorizationHeader(request: { headers?: { authorization?: string } }) {
    return request.headers?.authorization;
  }

  private assertAdminAccess(profile: { role?: string | null }) {
    if (!profile.role || !ADMIN_ROLES.has(profile.role)) {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Post('check-in')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Check in for today service' })
  @ApiOkResponse({
    description: 'Current user checked in for today service',
    schema: {
      example: {
        alreadyCheckedIn: false,
        service: {
          id: 'service-123',
          tenantId: 'tenant-001',
          name: 'Sunday Service — Sunday, 26 May 2026',
          scheduledAt: '2026-05-26T00:00:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
  async checkIn(@Req() request: { headers?: { authorization?: string } }) {
    const profile = await this.getCurrentProfile(this.getAuthorizationHeader(request));
    return this.attendanceService.checkIn(profile.id);
  }

  @Post('services/:serviceId/check-in')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Check in for a specific service' })
  @ApiOkResponse({
    description: 'Current user checked in for the selected service',
    schema: {
      example: {
        alreadyCheckedIn: true,
        service: {
          id: 'service-123',
          tenantId: 'tenant-001',
          name: 'Sunday Service — Sunday, 26 May 2026',
          scheduledAt: '2026-05-26T00:00:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
  async checkInByServiceId(
    @Param('serviceId') serviceId: string,
    @Req() request: { headers?: { authorization?: string } },
  ) {
    const profile = await this.getCurrentProfile(this.getAuthorizationHeader(request));
    return this.attendanceService.checkInByServiceId(profile.id, serviceId);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current member attendance history' })
  @ApiOkResponse({
    description: 'Member attendance list',
    schema: {
      example: [
        {
          id: 'attendance-123',
          memberId: 'member-001',
          serviceId: 'service-123',
          present: true,
          tenantId: 'tenant-001',
          Service: {
            id: 'service-123',
            name: 'Sunday Service — Sunday, 26 May 2026',
            scheduledAt: '2026-05-26T00:00:00.000Z',
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
  async getMyAttendance(@Req() request: { headers?: { authorization?: string } }) {
    const profile = await this.getCurrentProfile(this.getAuthorizationHeader(request));
    return this.attendanceService.getMemberAttendance(profile.id);
  }

  @Get('today')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get today service attendance with members' })
  @ApiOkResponse({
    description: 'Today service attendance summary',
    schema: {
      example: {
        service: {
          id: 'service-123',
          tenantId: 'tenant-001',
          name: 'Sunday Service — Sunday, 26 May 2026',
          scheduledAt: '2026-05-26T00:00:00.000Z',
        },
        records: [
          {
            id: 'attendance-123',
            memberId: 'member-001',
            serviceId: 'service-123',
            present: true,
            tenantId: 'tenant-001',
            Member: {
              id: 'member-001',
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane@example.com',
              phone: '+2348000000000',
            },
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getTodayAttendance(@Req() request: { headers?: { authorization?: string } }) {
    const profile = await this.getCurrentProfile(this.getAuthorizationHeader(request));
    this.assertAdminAccess(profile);
    return this.attendanceService.getTodayAttendanceWithMembers();
  }

  @Get('services')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get services with attendance counts' })
  @ApiOkResponse({
    description: 'Recent services with present-count totals',
    schema: {
      example: [
        {
          id: 'service-123',
          tenantId: 'tenant-001',
          name: 'Sunday Service — Sunday, 26 May 2026',
          scheduledAt: '2026-05-26T00:00:00.000Z',
          _count: {
            AttendanceRecord: 42,
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getServices(@Req() request: { headers?: { authorization?: string } }) {
    const profile = await this.getCurrentProfile(this.getAuthorizationHeader(request));
    this.assertAdminAccess(profile);
    return this.attendanceService.getAllServicesWithCounts();
  }

  @Get('services/next')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get next scheduled service' })
  @ApiOkResponse({
    description: 'Next service',
    schema: {
      example: {
        id: 'service-124',
        tenantId: 'tenant-001',
        name: 'Sunday Service — Sunday, 2 June 2026',
        scheduledAt: '2026-06-02T00:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getNextService(@Req() request: { headers?: { authorization?: string } }) {
    const profile = await this.getCurrentProfile(this.getAuthorizationHeader(request));
    this.assertAdminAccess(profile);
    return this.attendanceService.getNextService();
  }

  @Get('stats')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get attendance stats' })
  @ApiOkResponse({
    description: 'Attendance dashboard stats',
    schema: {
      example: {
        totalServices: 18,
        nextService: {
          id: 'service-124',
          tenantId: 'tenant-001',
          name: 'Sunday Service — Sunday, 2 June 2026',
          scheduledAt: '2026-06-02T00:00:00.000Z',
        },
        recentServices: [],
        todayCheckIns: 42,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getStats(@Req() request: { headers?: { authorization?: string } }) {
    const profile = await this.getCurrentProfile(this.getAuthorizationHeader(request));
    this.assertAdminAccess(profile);
    const [totalServices, nextService, recentServices, todayCheckIns] = await Promise.all([
      this.attendanceService.countTotalServices(),
      this.attendanceService.getNextService(),
      this.attendanceService.getRecentServicesStats(),
      this.attendanceService.countTodayCheckIns(),
    ]);

    return {
      totalServices,
      nextService,
      recentServices,
      todayCheckIns,
    };
  }

  @Get('trend')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get attendance trend' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    description: 'Attendance trend data',
    schema: {
      example: [
        {
          id: 'service-123',
          name: 'Sunday Service',
          date: '2026-05-26T00:00:00.000Z',
          label: '26 May',
          count: 42,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getAttendanceTrend(
    @Req() request: { headers?: { authorization?: string } },
    @Query('limit') limit?: string,
  ) {
    const profile = await this.getCurrentProfile(this.getAuthorizationHeader(request));
    this.assertAdminAccess(profile);
    return this.attendanceService.getAttendanceTrend(limit ? Number(limit) : 16);
  }

  @Get('day-of-week')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get attendance by day of week' })
  @ApiOkResponse({
    description: 'Attendance grouped by weekday',
    schema: {
      example: [
        { label: 'Sun', avg: 42, total: 84 },
        { label: 'Mon', avg: 0, total: 0 },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getAttendanceByDayOfWeek(@Req() request: { headers?: { authorization?: string } }) {
    const profile = await this.getCurrentProfile(this.getAuthorizationHeader(request));
    this.assertAdminAccess(profile);
    return this.attendanceService.getAttendanceByDayOfWeek();
  }

  @Get('top-attendees')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get top attendees' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    description: 'Top attendees ranked by attendance count',
    schema: {
      example: [
        {
          memberId: 'member-001',
          name: 'Jane Doe',
          photoUrl: null,
          count: 24,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getTopAttendees(
    @Req() request: { headers?: { authorization?: string } },
    @Query('limit') limit?: string,
  ) {
    const profile = await this.getCurrentProfile(this.getAuthorizationHeader(request));
    this.assertAdminAccess(profile);
    return this.attendanceService.getTopAttendees(limit ? Number(limit) : 10);
  }

  @Get('summary')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get attendance summary' })
  @ApiOkResponse({
    description: 'Attendance summary metrics',
    schema: {
      example: {
        totalServices: 18,
        totalCheckins: 420,
        thisMonthCheckins: 120,
        lastMonthCheckins: 98,
        avgAttendance: 23,
        momChange: 22,
        totalMembers: 300,
        attendanceRate: 8,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token is missing or invalid' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getAttendanceSummary(@Req() request: { headers?: { authorization?: string } }) {
    const profile = await this.getCurrentProfile(this.getAuthorizationHeader(request));
    this.assertAdminAccess(profile);
    return this.attendanceService.getAttendanceSummary();
  }
}