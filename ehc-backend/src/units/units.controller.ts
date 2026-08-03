import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { UnitsDirectoryService } from './services/units-directory.service';
import { UnitsSelfService } from './services/units-self.service';
import { UnitsCrudService } from './services/units-crud.service';

/**
 * Units: directory, self, and CRUD. See units-members.controller.ts for member/lead
 * assignment routes.
 *
 * 'directory' and 'me' are declared before the generic :unitId route — they share
 * its 1-segment GET shape, so this order is load-bearing.
 */
@ApiTags('units')
@Controller('units')
@ApiBearerAuth('access-token')
export class UnitsController {
  constructor(
    private readonly directory: UnitsDirectoryService,
    private readonly self: UnitsSelfService,
    private readonly crud: UnitsCrudService,
  ) {}

  @Get('directory')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'All units with leads/assistants + all leadership profiles (ADMIN+)' })
  @ApiOkResponse({
    description: 'Units with lead/assistant, plus all UNIT_LEAD / ADMIN / PASTOR / SUPER_ADMIN profiles',
  })
  async getDirectory() {
    return this.directory.getDirectory();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the unit the current user leads or assists (or null)' })
  async getMyUnit(@CurrentUser() user: AuthUser) {
    return this.self.findMyUnit(user.userId);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get every unit the current user leads or assists' })
  async getMyUnits(@CurrentUser() user: AuthUser) {
    return this.self.findMyUnits(user.userId);
  }

  @Get('mine/:unitId')
  @ApiOperation({
    summary: 'Get full detail for one unit the current user leads or assists (or ADMIN+)',
  })
  async getMyUnitDetail(@CurrentUser() user: AuthUser, @Param('unitId') unitId: string) {
    return this.self.findMyUnitDetail(user, unitId);
  }

  @Get('my-memberships')
  @ApiOperation({ summary: 'Get every unit the current user is a plain member of (excludes units they lead/assist)' })
  async getMyMemberships(@CurrentUser() user: AuthUser) {
    return this.self.findMyMemberships(user.userId);
  }

  @Get('my-memberships/:unitId')
  @ApiOperation({ summary: 'Get full detail for one unit the current user belongs to, in any capacity' })
  async getMyMembershipDetail(@CurrentUser() user: AuthUser, @Param('unitId') unitId: string) {
    return this.self.findMyMembershipDetail(user, unitId);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all units with lead + assistant (ADMIN+)' })
  async list() {
    return this.crud.listAll();
  }

  @Get(':unitId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get one unit with full member list including roles (ADMIN+)' })
  async getById(@Param('unitId') unitId: string) {
    return this.crud.getById(unitId);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new unit (ADMIN+)' })
  @ApiBody({ type: CreateUnitDto })
  async create(@Body() body: CreateUnitDto) {
    return this.crud.create(body);
  }

  @Patch(':unitId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a unit name/description (ADMIN+)' })
  @ApiBody({ type: UpdateUnitDto })
  async update(@Param('unitId') unitId: string, @Body() body: UpdateUnitDto) {
    return this.crud.update(unitId, body);
  }

  @Delete(':unitId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a unit (ADMIN+)' })
  async delete(@Param('unitId') unitId: string) {
    return this.crud.delete(unitId);
  }
}
