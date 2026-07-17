import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

/**
 * Care / discipleship assignments. ADMIN+ to manage; a leader sees who they
 * shepherd via the ?leaderId filter on the list endpoint.
 */
@ApiTags('assignments')
@Controller('assignments')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Assign members to a care/discipleship leader (ADMIN+)' })
  @ApiBody({ type: CreateAssignmentDto })
  async assign(@CurrentUser() actor: AuthUser, @Body() body: CreateAssignmentDto) {
    return this.assignments.assign(actor, body);
  }

  @Get()
  @ApiOperation({ summary: 'List assignments, filterable by leader or member (ADMIN+)' })
  @ApiQuery({ name: 'leaderId', required: false })
  @ApiQuery({ name: 'memberId', required: false })
  async list(
    @Query('leaderId') leaderId?: string,
    @Query('memberId') memberId?: string,
  ) {
    return this.assignments.list({ leaderId, memberId });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an assignment (ADMIN+)' })
  async remove(@Param('id') id: string) {
    return this.assignments.remove(id);
  }

  // ── Self-service (Unit Lead) ────────────────────────────────────────────────
  // Method-level @Roles overrides the class-level ADMIN requirement, per RolesGuard.

  @Get('me')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'List the people I shepherd, with their follow-up tasks (UNIT_LEAD+)' })
  async listMine(@CurrentUser() actor: AuthUser) {
    return this.assignments.listMine(actor.memberId);
  }

  @Post('me/:memberId/follow-up')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Add a follow-up task for someone I shepherd (UNIT_LEAD+)' })
  @ApiBody({ schema: { example: { title: 'Call to check in', dueDate: '2026-07-20' } } })
  async addFollowUp(
    @CurrentUser() actor: AuthUser,
    @Param('memberId') memberId: string,
    @Body() body: { title: string; dueDate?: string },
  ) {
    if (!actor.memberId) throw new ForbiddenException('No member profile linked to this account');
    return this.assignments.addFollowUpTaskAsLeader(actor.memberId, memberId, body.title, body.dueDate);
  }

  @Patch('me/follow-up/:taskId')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Toggle a follow-up task done, for someone I shepherd (UNIT_LEAD+)' })
  @ApiBody({ schema: { example: { done: true } } })
  async toggleFollowUp(
    @CurrentUser() actor: AuthUser,
    @Param('taskId') taskId: string,
    @Body('done') done: boolean,
  ) {
    if (!actor.memberId) throw new ForbiddenException('No member profile linked to this account');
    return this.assignments.toggleFollowUpTaskAsLeader(actor.memberId, taskId, !!done);
  }
}
