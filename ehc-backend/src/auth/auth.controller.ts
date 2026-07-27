import { Body, Controller, Post, Req, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { AuthLoginService } from './services/auth-login.service';
import { AuthSessionService } from './services/auth-session.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginSvc: AuthLoginService,
    private readonly session: AuthSessionService,
  ) {}

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
  async login(
    @Body() body: LoginDto,
    @Req() request: { headers?: Record<string, string | undefined>; ip?: string },
  ) {
    const ip =
      request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || request.ip;
    const userAgent = request.headers?.['user-agent'];
    return this.loginSvc.login(body.email, body.password, { ip, userAgent });
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
    return this.session.refresh(body.refresh_token);
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
    return this.session.requestPasswordReset(body.email);
  }
}
