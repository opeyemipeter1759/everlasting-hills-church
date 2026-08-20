import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateUnitPositionDto, SetMemberPositionDto, UpdateUnitPositionDto } from './dto/unit-position.dto';
import { UnitPositionsService } from './services/unit-positions.service';

/**
 * Custom named positions/titles within a unit (e.g. "Secretary", "Treasurer").
 * Permission is enforced in the service (lead/assistant of this unit, or ADMIN+) —
 * mirrors the no-@Roles pattern used by units-members.controller.ts's addMember.
 */
@ApiTags('units')
@Controller('units')
@ApiBearerAuth('access-token')
export class UnitPositionsController {
  constructor(private readonly positions: UnitPositionsService) {}

  @Get(':unitId/positions')
  @ApiOperation({ summary: 'List positions defined for a unit' })
  async list(@CurrentUser() actor: AuthUser, @Param('unitId') unitId: string) {
    return this.positions.list(actor, unitId);
  }

  @Post(':unitId/positions')
  @ApiOperation({ summary: 'Create a position for a unit (lead/assistant of unit, or ADMIN+)' })
  @ApiBody({ type: CreateUnitPositionDto })
  async create(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: CreateUnitPositionDto,
  ) {
    return this.positions.create(actor, unitId, body);
  }

  @Patch(':unitId/positions/:positionId')
  @ApiOperation({ summary: 'Rename a position' })
  @ApiBody({ type: UpdateUnitPositionDto })
  async update(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('positionId') positionId: string,
    @Body() body: UpdateUnitPositionDto,
  ) {
    return this.positions.update(actor, unitId, positionId, body);
  }

  @Delete(':unitId/positions/:positionId')
  @ApiOperation({ summary: 'Delete a position' })
  async delete(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('positionId') positionId: string,
  ) {
    return this.positions.delete(actor, unitId, positionId);
  }

  @Patch(':unitId/members/:memberId/position')
  @ApiOperation({ summary: "Set or clear a unit member's position" })
  @ApiBody({ type: SetMemberPositionDto })
  async setMemberPosition(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('memberId') memberId: string,
    @Body() body: SetMemberPositionDto,
  ) {
    return this.positions.setMemberPosition(actor, unitId, memberId, body);
  }
}
