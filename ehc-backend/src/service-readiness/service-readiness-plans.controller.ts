import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { ServiceReadinessPlansService } from './service-readiness-plans.service';
import { ServiceReadinessViewsService } from './service-readiness-views.service';
import { ServiceReadinessUpdatesService } from './service-readiness-updates.service';
import { SaveReadinessPlanDto } from './dto/save-readiness-plan.dto';
import { PostReadinessUpdateDto } from './dto/post-readiness-update.dto';

/**
 * A unit leader's side of Stage 1. Any signed-in member reaches these routes;
 * the service decides whose units they are (lead, assistant, or head of the
 * department), and the Church Administrator may act for any.
 */
@ApiTags('service-readiness')
@ApiBearerAuth('access-token')
@Roles(Role.MEMBER)
@Controller('service-readiness')
export class ServiceReadinessPlansController {
  constructor(
    private readonly plans: ServiceReadinessPlansService,
    private readonly views: ServiceReadinessViewsService,
    private readonly updates: ServiceReadinessUpdatesService,
  ) {}

  @Get('mine')
  @ApiOperation({ summary: "The units I lead, for the coming Sunday and Wednesday: my plan and updates, the roster, and last time's plan" })
  mine(@CurrentUser() actor: AuthUser) {
    return this.views.mine(actor);
  }

  @Put('services/:serviceId/units/:unitId/plan')
  @ApiOperation({ summary: "Submit a unit's plan for a service (due 24 hours before it must be ready)" })
  savePlan(
    @CurrentUser() actor: AuthUser,
    @Param('serviceId') serviceId: string,
    @Param('unitId') unitId: string,
    @Body() body: SaveReadinessPlanDto,
  ) {
    return this.plans.savePlan(actor, serviceId, unitId, body);
  }

  @Post('services/:serviceId/units/:unitId/updates')
  @ApiOperation({ summary: "Post an update on a submitted plan: everything ready, or a blocker" })
  postUpdate(
    @CurrentUser() actor: AuthUser,
    @Param('serviceId') serviceId: string,
    @Param('unitId') unitId: string,
    @Body() body: PostReadinessUpdateDto,
  ) {
    return this.updates.postUpdate(actor, serviceId, unitId, body);
  }
}
