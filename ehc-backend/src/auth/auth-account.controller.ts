import { Body, Controller, Get, Post, Req, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './types/auth-user';
import { AuthSessionService } from './services/auth-session.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthMeService } from './services/auth-me.service';

/** Actions for an already-authenticated session: change password, logout, "who am I". */
@ApiTags('auth')
@Controller('auth')
export class AuthAccountController {
  constructor(
    private readonly session: AuthSessionService,
    private readonly password: AuthPasswordService,
    private readonly authMe: AuthMeService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Change Password',
    description: 'Update the signed-in user\'s password. Caller must already have a valid JWT (normal login or recovery-link session).',
  })
  @ApiOkResponse({
    description: 'Password updated',
    schema: { example: { success: true, message: 'Password updated successfully' } },
  })
  @ApiUnauthorizedResponse({ description: 'Access token missing, invalid, or update rejected' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async changePassword(
    @Body() body: ChangePasswordDto,
    @Req() request: { headers?: { authorization?: string }; ip?: string },
  ) {
    const ip =
      (request.headers as Record<string, string> | undefined)?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.ip;
    return this.password.changePassword(request.headers?.authorization, body.password, ip);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User Logout', description: 'Invalidate the current user session' })
  @ApiOkResponse({
    description: 'User logged out',
    schema: { example: { success: true, message: 'Logged out successfully' } },
  })
  @ApiUnauthorizedResponse({ description: 'Access token missing or invalid' })
  async logout(@Req() request: { headers?: { authorization?: string } }) {
    return this.session.logout(request.headers?.authorization);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user dashboard payload' })
  @ApiOkResponse({
    description: 'Current user profile + member data',
    schema: {
      example: {
        profileId: 'profile-uuid',
        role: 'MEMBER',
        tenantId: 'ehc_...',
        member: {
          id: 'member-uuid',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          phone: '+234...',
          address: 'Ibadan',
          dateOfBirth: '1990-01-01T00:00:00.000Z',
          bio: null,
          photoUrl: null,
          joinedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token missing or invalid' })
  async me(@CurrentUser() user: AuthUser) {
    return this.authMe.getMe(user.userId);
  }
}
