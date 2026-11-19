import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { PreMaritalService } from './pre-marital.service';

/**
 * Pre-marital counselling. Couples apply on the public site (no sign-in);
 * pastors review the applications under Pastoral. The application routes are
 * for pastors (and anyone given the page on the Permissions screen).
 */
@ApiTags('pre-marital-counselling')
@Controller('pre-marital-counselling')
@ApiBearerAuth('access-token')
export class PreMaritalController {
  constructor(private readonly service: PreMaritalService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Apply for pre-marital counselling (public); sending the same submissionKey again returns the same application',
  })
  submit(@Body() body: unknown) {
    return this.service.submit(body);
  }

  @Get('applications')
  @Roles(Role.PASTOR)
  @ApiOperation({
    summary:
      'Pre-marital counselling applications, newest first, with counts by status (pastors)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['NEW', 'IN_REVIEW', 'CLOSED'],
  })
  list(@CurrentUser() actor: AuthUser, @Query('status') status?: string) {
    return this.service.list(actor, { status: status || undefined });
  }

  @Get('applications/:id')
  @Roles(Role.PASTOR)
  @ApiOperation({
    summary: 'One pre-marital counselling application in full (pastors)',
  })
  get(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.service.get(actor, id);
  }

  @Patch('applications/:id/status')
  @Roles(Role.PASTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Change a pre-marital counselling application's status: New, In review or Closed (pastors)",
  })
  updateStatus(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.service.updateStatus(actor, id, body);
  }
}
