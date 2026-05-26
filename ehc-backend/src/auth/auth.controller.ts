import { Body, Controller, Get, Post, Req } from '@nestjs/common';
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
          fullName: 'Jane Doe',
          picture: 'https://example.com/avatar.jpg',
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
            fullName: { type: 'string', description: 'User full name' },
            picture: { type: 'string', description: 'User avatar/picture URL' },
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
  async logout(@Req() request: { headers?: { authorization?: string } }) {
    return this.authService.logout(request.headers?.authorization);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the profile of the currently authenticated user',
  })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'Current user profile',
    schema: {
      example: {
        id: 'user-123',
        email: 'user@example.com',
        role: 'member',
        fullName: 'Jane Doe',
        picture: 'https://example.com/avatar.jpg',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
    schema: {
      example: {
        statusCode: 401,
        message: 'Access token is required',
      },
    },
  })
  async me(@Req() request: { headers?: { authorization?: string } }) {
    return this.authService.getProfile(request.headers?.authorization);
  }
}
