import { Body, Controller, Get, Param, ParseEnumPipe, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InspectionRound, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServiceReadinessSetupService } from './service-readiness-setup.service';
import { ServiceReadinessViewsService } from './service-readiness-views.service';
import { ServiceReadinessUpdatesService } from './service-readiness-updates.service';
import { UpdateReadinessUnitDto } from './dto/update-readiness-unit.dto';
import { ServiceInspectionsService } from './service-inspections.service';
import { SaveInspectionDto } from './dto/save-inspection.dto';

/**
 * Service Readiness, from the Administration Manual. The Church Administrator
 * is Admin Head and above (Pastor, Super Admin): ADMIN_HEAD is the lowest role
 * that passes, and ADMIN shares its level.
 */
@ApiTags('service-readiness')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN_HEAD)
@Controller('service-readiness')
export class ServiceReadinessController {
  constructor(
    private readonly setup: ServiceReadinessSetupService,
    private readonly views: ServiceReadinessViewsService,
    private readonly inspections: ServiceInspectionsService,
    private readonly updates: ServiceReadinessUpdatesService,
  ) {}

  @Get('board')
  @ApiOperation({ summary: 'Every unit for the next (or a chosen) Sunday or Wednesday service: submitted or not, approved, ready or blocked' })
  getBoard(@Query('serviceId') serviceId?: string) {
    return this.views.board(serviceId);
  }

  @Put('services/:serviceId/units/:unitId/approve')
  @ApiOperation({ summary: "Approve a unit's submitted plan for a service" })
  approve(@CurrentUser() actor: AuthUser, @Param('serviceId') serviceId: string, @Param('unitId') unitId: string) {
    return this.updates.approve(actor, serviceId, unitId);
  }

  @Get('setup')
  @ApiOperation({
    summary: "Each unit's Sunday and Wednesday inspection checklists, and the next services with ready-by times",
  })
  getSetup() {
    return this.setup.setup();
  }

  @Put('units/:unitId')
  @ApiOperation({ summary: "Save one unit's Sunday / Wednesday checklists" })
  updateUnit(@Param('unitId') unitId: string, @Body() body: UpdateReadinessUnitDto) {
    return this.setup.updateUnit(unitId, body);
  }

  @Get('services/:serviceId/inspections/:round')
  @ApiOperation({ summary: "Inspect a service: each serving department's checklist, plan and saved result for the day-before or 2-hours-before round" })
  getInspection(
    @Param('serviceId') serviceId: string,
    @Param('round', new ParseEnumPipe(InspectionRound)) round: InspectionRound,
  ) {
    return this.inspections.sheet(serviceId, round);
  }

  @Put('services/:serviceId/units/:unitId/inspections/:round')
  @ApiOperation({ summary: "Record one department's inspection: each checklist line ticked or not, and a note" })
  saveInspection(
    @CurrentUser() actor: AuthUser,
    @Param('serviceId') serviceId: string,
    @Param('unitId') unitId: string,
    @Param('round', new ParseEnumPipe(InspectionRound)) round: InspectionRound,
    @Body() body: SaveInspectionDto,
  ) {
    return this.inspections.save(actor, serviceId, unitId, round, body);
  }
}
