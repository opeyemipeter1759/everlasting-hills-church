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
import { Public } from './decorators/public.decorator';

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
  @ApiOkResponse({ description: 'User logged in', schema: { example: { access_token: 'tok', user: { id: 'user-1', email: 'user@example.com', role: 'MEMBER' }, session: { access_token: 'tok', expires_in: 3600 } } } })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User Logout', description: 'Invalidate the current user session' })
  @ApiOkResponse({ description: 'User logged out', schema: { example: { success: true, message: 'Logged out successfully' } } })
  @ApiUnauthorizedResponse({ description: 'Access token missing or invalid' })
  async logout(@Req() request: { headers?: { authorization?: string } }) {
    return this.authService.logout(request.headers?.authorization);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Current user profile', schema: { example: { id: 'user-1', email: 'user@example.com', role: 'MEMBER', fullName: 'Jane Doe' } } })
  @ApiUnauthorizedResponse({ description: 'Access token missing or invalid' })
  async me(@Req() request: { headers?: { authorization?: string } }) {
    return this.authService.getProfile(request.headers?.authorization);
  }
}
