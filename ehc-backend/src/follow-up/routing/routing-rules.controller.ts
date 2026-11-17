import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { RoutingRulesService } from './routing-rules.service';

/** Who new first-timers are routed to. Admin only. */
@ApiTags('routing-rules')
@Controller('routing-rules')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class RoutingRulesController {
  constructor(private readonly rules: RoutingRulesService) {}

  @Get()
  @ApiOperation({ summary: 'Every routing rule with its unit, pool and each person\'s open load' })
  list() {
    return this.rules.list();
  }

  @Get('options')
  @ApiOperation({ summary: 'Units and their active members, for picking a pool' })
  options() {
    return this.rules.options();
  }

  @Post()
  @ApiOperation({ summary: 'Add a routing rule' })
  create(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.rules.create(actor, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change a rule\'s name, unit, pool, priority, or switch it on or off' })
  update(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.rules.update(actor, id, body);
  }
}
