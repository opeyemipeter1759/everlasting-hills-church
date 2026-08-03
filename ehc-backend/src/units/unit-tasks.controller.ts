import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateUnitTaskDto, UpdateUnitTaskDto } from './dto/unit-task.dto';
import { CreateUnitTaskCommentDto } from './dto/unit-task-comment.dto';
import { UnitTasksService } from './services/unit-tasks.service';
import { UnitTaskCommentsService } from './services/unit-task-comments.service';

@ApiTags('units')
@Controller('units')
@ApiBearerAuth('access-token')
export class UnitTasksController {
  constructor(
    private readonly tasks: UnitTasksService,
    private readonly comments: UnitTaskCommentsService,
  ) {}

  @Get(':unitId/tasks')
  @ApiOperation({ summary: 'List tasks for a unit' })
  async list(@CurrentUser() actor: AuthUser, @Param('unitId') unitId: string) {
    return this.tasks.list(actor, unitId);
  }

  @Post(':unitId/tasks')
  @ApiOperation({ summary: 'Create and assign a task within a unit (lead/assistant of unit, or ADMIN+)' })
  @ApiBody({ type: CreateUnitTaskDto })
  async create(@CurrentUser() actor: AuthUser, @Param('unitId') unitId: string, @Body() body: CreateUnitTaskDto) {
    return this.tasks.create(actor, unitId, body);
  }

  @Patch(':unitId/tasks/:taskId')
  @ApiOperation({
    summary: 'Update a task. Lead/assistant can edit anything; an assignee may only change its status.',
  })
  @ApiBody({ type: UpdateUnitTaskDto })
  async update(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('taskId') taskId: string,
    @Body() body: UpdateUnitTaskDto,
  ) {
    return this.tasks.update(actor, unitId, taskId, body);
  }

  @Delete(':unitId/tasks/:taskId')
  @ApiOperation({ summary: 'Delete a task' })
  async delete(@CurrentUser() actor: AuthUser, @Param('unitId') unitId: string, @Param('taskId') taskId: string) {
    return this.tasks.delete(actor, unitId, taskId);
  }

  @Get(':unitId/tasks/:taskId/comments')
  @ApiOperation({ summary: 'List comments on a task (any unit member)' })
  async listComments(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.comments.list(actor, unitId, taskId);
  }

  @Post(':unitId/tasks/:taskId/comments')
  @ApiOperation({ summary: 'Comment on a task (any unit member)' })
  @ApiBody({ type: CreateUnitTaskCommentDto })
  async addComment(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('taskId') taskId: string,
    @Body() body: CreateUnitTaskCommentDto,
  ) {
    return this.comments.create(actor, unitId, taskId, body);
  }
}
