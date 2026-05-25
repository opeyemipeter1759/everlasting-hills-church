import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * @Public — login is the entry point; obviously cannot require auth.
   * @Throttle — tighter than the global limit to slow credential-stuffing attacks.
   *             5 attempts per minute per IP. Tune based on real abuse signal.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Login',
    description: 'Authenticate user with email and password to receive a Supabase JWT.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'User logged in successfully',
    schema: {
      example: {
        access_token: 'eyJhbGciOi...',
        refresh_token: 'eyJhbGciOi...',
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-uuid', email: 'user@example.com', role: 'MEMBER' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'User Logout',
    description: 'Invalidate the current user session using the bearer access token.',
  })
  @ApiOkResponse({
    description: 'User logged out successfully',
    schema: { example: { success: true, message: 'Logged out successfully' } },
  })
  @ApiUnauthorizedResponse({ description: 'Access token missing, invalid, or logout failed' })
  async logout(@Headers('authorization') authorization?: string) {
    return this.authService.logout(authorization);
  }
}
