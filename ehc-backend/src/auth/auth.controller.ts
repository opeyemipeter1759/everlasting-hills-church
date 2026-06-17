import { Body, Controller, Get, Post, Req, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './types/auth-user';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Login', description: 'Authenticate user with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'User logged in',
    schema: {
      example: {
        access_token: 'eyJhbGciOi...',
        refresh_token: 'eyJhbGciOi...',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'user-uuid',
          email: 'user@example.com',
          role: 'MEMBER',
          fullName: 'Jane Doe',
          picture: null,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh Access Token',
    description: 'Exchange a valid refresh token for a fresh access token (+ rotated refresh token).',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ description: 'New session issued' })
  @ApiUnauthorizedResponse({ description: 'Refresh token missing, invalid, or expired' })
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refresh_token);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request Password Reset',
    description: 'Send a Supabase recovery email. Always returns success to avoid leaking which emails exist.',
  })
  @ApiOkResponse({
    description: 'Reset email dispatched (or silently no-op if the address is unknown)',
    schema: { example: { success: true, message: 'If an account exists for that email, a reset link has been sent.' } },
  })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.email);
  }

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
    @Req() request: { headers?: { authorization?: string } },
  ) {
    return this.authService.changePassword(request.headers?.authorization, body.password);
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
    return this.authService.logout(request.headers?.authorization);
  }

  /**
   * Returns the current user's identity + their Member profile (if linked).
   *
   * Why @CurrentUser instead of reading the header again: the JwtAuthGuard already verified
   * the JWT signature and looked up the Profile. Re-doing both work here would mean two
   * DB queries per request. The @CurrentUser decorator just reads what's already on req.user.
   *
   * The frontend dashboard calls this as its single source of truth for "who am I".
   */
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
    return this.authService.getMe(user.userId);
  }
}
