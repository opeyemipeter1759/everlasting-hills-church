import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { PledgeDto } from './dto/pledge.dto';
import { PledgeService } from './services/pledge.service';

/**
 * Financial pledges towards church projects, such as the Sound & Media
 * Project at /pledges/sound-media.
 *
 * Members pledge and see their own pledge. The full list is ADMIN and above:
 * Admin, Admin Head, Pastor and Super Admin.
 */
@ApiTags('pledges')
@Controller('pledges')
@ApiBearerAuth('access-token')
export class PledgesController {
  constructor(private readonly pledges: PledgeService) {}

  @Get(':campaign/mine')
  @Roles(Role.MEMBER)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Your own pledge to this project, or null if you have not pledged' })
  mine(@CurrentUser() actor: AuthUser, @Param('campaign') campaign: string) {
    return this.pledges.mine(actor, campaign);
  }

  @Post(':campaign')
  @Roles(Role.MEMBER)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Make or update your pledge to this project' })
  submit(
    @CurrentUser() actor: AuthUser,
    @Param('campaign') campaign: string,
    @Body() body: PledgeDto,
  ) {
    return this.pledges.submit(actor, campaign, body);
  }

  @Get(':campaign')
  @Roles(Role.ADMIN)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Every pledge to this project, with totals (ADMIN+)' })
  list(@Param('campaign') campaign: string) {
    return this.pledges.list(campaign);
  }
}
