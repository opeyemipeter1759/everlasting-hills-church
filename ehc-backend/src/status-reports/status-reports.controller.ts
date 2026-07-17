import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AddCommentDto, CreateReportDto, RequestCorrectionDto, UpdateReportDto } from './dto/status-report.dto';
import { StatusReportsService } from './status-reports.service';

/**
 * Status reports: a Unit Lead / Department Head logs what's going on in their
 * unit/department; a Super Admin reviews it on the Audit Log page.
 *
 * Class-gate at UNIT_LEAD — the lowest role that can ever submit a report.
 * Exactly which department/unit an actor may submit for is enforced per-call
 * in the service (must actively head that department or lead that unit).
 * Review actions (approve / request-correction) are further gated to SUPER_ADMIN.
 */
@ApiTags('status-reports')
@Controller('status-reports')
@Roles(Role.UNIT_LEAD)
@ApiBearerAuth('access-token')
export class StatusReportsController {
  constructor(private readonly reports: StatusReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a status report for a department or unit you lead' })
  async create(@CurrentUser() actor: AuthUser, @Body() body: CreateReportDto) {
    return this.reports.create(actor, body);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Reports you submitted' })
  async listMine(@CurrentUser() actor: AuthUser) {
    return this.reports.listMine(actor);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'All status reports, newest first — Audit Log (SUPER_ADMIN)' })
  async listAll(@Query('status') status?: string) {
    return this.reports.listAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Report detail with comments (author or SUPER_ADMIN)' })
  async getById(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.reports.getById(actor, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Resubmit a report after a correction request (author only)' })
  async update(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: UpdateReportDto) {
    return this.reports.update(actor, id, body);
  }

  @Patch(':id/approve')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a report (SUPER_ADMIN)' })
  async approve(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.reports.approve(actor, id);
  }

  @Patch(':id/request-correction')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send a report back for correction, with a required comment (SUPER_ADMIN)' })
  async requestCorrection(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: RequestCorrectionDto) {
    return this.reports.requestCorrection(actor, id, body.comment);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Comment on a report (author or SUPER_ADMIN)' })
  async addComment(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: AddCommentDto) {
    return this.reports.addComment(actor, id, body.content);
  }
}
