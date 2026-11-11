import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { ServiceReadinessTasksService } from './service-readiness-tasks.service';
import { AddReadinessTasksDto, UpdateReadinessTaskDto } from './dto/readiness-task.dto';

/** A unit's task list for a service: its leaders and the Church Administrator (checked in the service). */
@ApiTags('service-readiness')
@ApiBearerAuth('access-token')
@Roles(Role.MEMBER)
@Controller('service-readiness/services/:serviceId/units/:unitId/tasks')
export class ServiceReadinessTasksController {
  constructor(private readonly tasks: ServiceReadinessTasksService) {}

  @Post()
  @ApiOperation({ summary: "Add tasks to a unit's plan for a service" })
  add(@CurrentUser() actor: AuthUser, @Param('serviceId') serviceId: string, @Param('unitId') unitId: string, @Body() body: AddReadinessTasksDto) {
    return this.tasks.add(actor, serviceId, unitId, body);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Tick a task off, or rename it' })
  update(
    @CurrentUser() actor: AuthUser,
    @Param('serviceId') serviceId: string,
    @Param('unitId') unitId: string,
    @Param('taskId') taskId: string,
    @Body() body: UpdateReadinessTaskDto,
  ) {
    return this.tasks.update(actor, serviceId, unitId, taskId, body);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Remove a task' })
  remove(@CurrentUser() actor: AuthUser, @Param('serviceId') serviceId: string, @Param('unitId') unitId: string, @Param('taskId') taskId: string) {
    return this.tasks.remove(actor, serviceId, unitId, taskId);
  }
}
