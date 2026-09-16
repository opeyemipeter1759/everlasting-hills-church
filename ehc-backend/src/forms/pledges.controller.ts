import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { PledgeDto } from './dto/pledge.dto';
import { PledgeInstallmentDto } from './dto/pledge-installment.dto';
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
export class PledgesController {
  constructor(private readonly pledges: PledgeService) {}

  @Get(':campaign/mine')
  @Roles(Role.MEMBER)
  @ApiBearerAuth('access-token')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Your own pledge to this project, or null if you have not pledged' })
  mine(@CurrentUser() actor: AuthUser, @Param('campaign') campaign: string) {
    return this.pledges.mine(actor, campaign);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post(':campaign/public')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Make a pledge from the public church website',
    description:
      'Available without an account. If the visitor is signed in, the pledge is linked to them and updates their existing project pledge.',
  })
  @ApiCreatedResponse({ description: 'Pledge submitted successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  submitPublic(
    @Param('campaign') campaign: string,
    @Body() body: PledgeDto,
    @CurrentUser() actor?: AuthUser,
  ) {
    return this.pledges.submitPublic(actor, campaign, body);
  }

  @Public()
  @Get(':campaign/track/:token')
  @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Open a public pledge using its private tracking link' })
  track(@Param('campaign') campaign: string, @Param('token') token: string) {
    return this.pledges.tracked(campaign, token);
  }

  @Public()
  @Post(':campaign/track/:token/installments')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Record an installment using a private public tracking link' })
  addTrackedInstallment(
    @Param('campaign') campaign: string,
    @Param('token') token: string,
    @Body() body: PledgeInstallmentDto,
  ) {
    return this.pledges.addTrackedInstallment(campaign, token, body);
  }

  @Post(':campaign/mine/installments')
  @Roles(Role.MEMBER)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Record an installment on your own pledge' })
  addMineInstallment(
    @CurrentUser() actor: AuthUser,
    @Param('campaign') campaign: string,
    @Body() body: PledgeInstallmentDto,
  ) {
    return this.pledges.addMineInstallment(actor, campaign, body);
  }

  @Post(':campaign')
  @Roles(Role.MEMBER)
  @ApiBearerAuth('access-token')
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
  @ApiBearerAuth('access-token')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Every pledge to this project, with totals (ADMIN+)' })
  list(@Param('campaign') campaign: string) {
    return this.pledges.list(campaign);
  }
}
