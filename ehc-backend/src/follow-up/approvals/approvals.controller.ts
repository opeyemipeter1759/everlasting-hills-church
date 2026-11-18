import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { ApprovalsService } from './approvals.service';

/**
 * Approvals. Who may ask and who may decide is checked in the service against
 * the current assignment rows, so MEMBER here is only the floor.
 */
@ApiTags('approvals')
@Controller('approvals')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Post()
  @ApiOperation({ summary: 'Ask for a first-timer to be integrated (their assignee or an admin)' })
  request(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.approvals.request(actor, body);
  }

  @Post(':id/decide')
  @HttpCode(200)
  @ApiOperation({ summary: "Approve or request changes (the unit's current lead, else its department head, else an admin; admins may override)" })
  decide(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.approvals.decide(actor, id, body);
  }

  @Get('access')
  @ApiOperation({ summary: 'Whether the caller decides first-timer approvals, so the menu shows Approvals only to them' })
  access(@CurrentUser() actor: AuthUser) {
    return this.approvals.access(actor);
  }

  @Get('queue')
  @ApiOperation({ summary: 'Pending requests the caller may decide, oldest first' })
  @ApiQuery({ name: 'unitId', required: false })
  queue(@CurrentUser() actor: AuthUser, @Query('unitId') unitId?: string) {
    return this.approvals.queue(actor, unitId || undefined);
  }

  @Get('subject/:visitorId')
  @ApiOperation({ summary: "A first-timer's latest approval request, and what the caller may do about it" })
  subject(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    return this.approvals.forSubject(actor, visitorId);
  }
}
