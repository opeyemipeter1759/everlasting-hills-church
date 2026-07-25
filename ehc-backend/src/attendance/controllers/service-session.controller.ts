import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ServiceSessionManagementService } from '../services/service-session-management.service';
import { AttendanceOverviewService } from '../services/attendance-overview.service';
import { AttendanceExportService } from '../services/attendance-export.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

/** ADMIN CRUD + lifecycle on Service sessions (create/edit/delete/open/close/export/next). */
@ApiTags('attendance')
@Controller('attendance')
@ApiBearerAuth('access-token')
export class ServiceSessionController {
  constructor(
    private readonly sessionMgmt: ServiceSessionManagementService,
    private readonly overview: AttendanceOverviewService,
    private readonly exportSvc: AttendanceExportService,
  ) {}

  @Get('services')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get services with attendance counts (ADMIN+)' })
  async getServices() {
    return this.overview.getAllServicesWithCounts();
  }

  @Post('services')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a service session (ADMIN+)' })
  async createService(@Body() body: CreateServiceDto) {
    return this.sessionMgmt.createService(body);
  }

  @Patch('services/:serviceId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Edit a service's name/date/type (ADMIN+)" })
  async updateService(@Param('serviceId') serviceId: string, @Body() body: UpdateServiceDto) {
    return this.sessionMgmt.updateService(serviceId, body);
  }

  @Delete('services/:serviceId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a service and its check-in records (ADMIN+)' })
  async removeService(@Param('serviceId') serviceId: string) {
    return this.sessionMgmt.removeService(serviceId);
  }

  @Patch('services/:serviceId/open')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Open a service for check-in (ADMIN+)' })
  async openService(@Param('serviceId') serviceId: string) {
    return this.sessionMgmt.openService(serviceId);
  }

  @Patch('services/:serviceId/close')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Close a service (ADMIN+)' })
  async closeService(@Param('serviceId') serviceId: string) {
    return this.sessionMgmt.closeService(serviceId);
  }

  @Get('services/:serviceId/export')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Export a service attendance as CSV (ADMIN+)' })
  async exportService(@Param('serviceId') serviceId: string) {
    return this.exportSvc.exportServiceCsv(serviceId);
  }

  /**
   * Next-service is read by both the admin dashboard and the UNIT_LEAD dashboard, so it's
   * accessible to any authenticated user — not gated to ADMIN.
   */
  @Get('services/next')
  @ApiOperation({ summary: 'Get next scheduled service' })
  async getNextService() {
    return this.overview.getNextService();
  }
}
