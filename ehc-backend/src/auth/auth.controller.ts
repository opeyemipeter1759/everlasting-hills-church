import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiTags,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginDto } from '../dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'User Login',
    description: 'Authenticate user with email and password to receive JWT access token',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User credentials',
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'User logged in successfully',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'member',
        },
        session: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      },
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT access token for authenticated requests',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
            email: { type: 'string', description: 'User email' },
            role: { type: 'string', description: 'User role' },
          },
        },
        session: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            expires_in: { type: 'number', description: 'Token expiration in seconds' },
            token_type: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid email or password',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Email and password are required',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email and password are required',
      },
    },
  })
  async login(@Body() body: LoginDto) {
    const { email, password } = body || {};
    return this.authService.login(email ?? '', password ?? '');
  }

  @Post('logout')
  @ApiOperation({
    summary: 'User Logout',
    description: 'Invalidate the current user session using the bearer access token.',
  })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'User logged out successfully',
    schema: {
      example: {
        success: true,
        message: 'Logged out successfully',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing, invalid, or logout failed',
    schema: {
      example: {
        statusCode: 401,
        message: 'Access token is required',
      },
    },
  })
  async logout(@Headers('authorization') authorization?: string) {
    return this.authService.logout(authorization);
  }
}
