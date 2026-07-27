import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { AttendanceCheckInService } from '../services/attendance-checkin.service';
import { AttendanceHistoryService } from '../services/attendance-history.service';
import { AttendanceSessionWindowService } from '../services/attendance-session-window.service';

/** Member self-service: check in, view own history, check whether marking is currently allowed. */
@ApiTags('attendance')
@Controller('attendance')
@ApiBearerAuth('access-token')
export class AttendanceSelfServiceController {
  constructor(
    private readonly checkIn: AttendanceCheckInService,
    private readonly history: AttendanceHistoryService,
    private readonly sessionWindow: AttendanceSessionWindowService,
  ) {}

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
  async checkIn_(@CurrentUser() user: AuthUser) {
    // Pass the Supabase userId — the service looks up Profile by `userId` column
    // and auto-provisions a Member row if the user has a Profile but no Member.
    return this.checkIn.checkIn(user.userId, user.email);
  }

  @Post('services/:serviceId/check-in')
  @ApiOperation({ summary: 'Check in for a specific service' })
  async checkInByServiceId(
    @CurrentUser() user: AuthUser,
    @Param('serviceId') serviceId: string,
  ) {
    return this.checkIn.checkInByServiceId(user.userId, serviceId, user.email);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current member attendance history' })
  async getMyAttendance(@CurrentUser() user: AuthUser) {
    return this.history.getMemberAttendance(user.userId);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Per-service present/absent tracking for the current member' })
  async getMyHistory(@CurrentUser() user: AuthUser) {
    return this.history.getMemberHistory(user.userId);
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
    return this.sessionWindow.canMark(user.userId);
  }
}
