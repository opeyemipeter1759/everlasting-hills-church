import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MemberStatus, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServiceTeamsService } from './service-teams.service';

/**
 * The serving roster, read one row per person.
 *
 * ADMIN admits ADMIN, ADMIN_HEAD, PASTOR and SUPER_ADMIN, which is the same set
 * that may already add somebody to a unit. HOD is deliberately below it: an HOD
 * heads one department and has no business reading the whole church's roster
 * from here.
 */
@ApiTags('service-teams')
@Controller('service-teams')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class ServiceTeamsController {
  constructor(private readonly serviceTeams: ServiceTeamsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Everyone on at least one service team, with every team they are on' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'role', required: false, enum: ['LEAD', 'ASSISTANT', 'MEMBER'] })
  @ApiQuery({ name: 'status', required: false, enum: MemberStatus })
  roster(
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('unitId') unitId?: string,
    @Query('role') role?: 'LEAD' | 'ASSISTANT' | 'MEMBER',
    @Query('status') status?: MemberStatus,
  ) {
    return this.serviceTeams.roster({ search, departmentId, unitId, role, status });
  }
}
