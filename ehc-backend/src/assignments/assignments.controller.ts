import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
}
