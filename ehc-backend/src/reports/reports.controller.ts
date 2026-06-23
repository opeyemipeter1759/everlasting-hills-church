import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function sendXlsx(res: Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', XLSX_MIME);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}

@ApiTags('reports')
@Controller('reports')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  @ApiOperation({ summary: 'Monthly attendance summary — Excel (ADMIN+)' })
  @ApiQuery({ name: 'month', example: '2026-06' })
  async monthly(
    @Query('month') month = new Date().toISOString().slice(0, 7),
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.reportsService.monthlyReport(month);
    sendXlsx(res, buffer, filename);
  }

  @Get('member/:userId')
  @ApiOperation({ summary: 'Full member attendance history — Excel (ADMIN+)' })
  async memberHistory(@Param('userId') userId: string, @Res() res: Response) {
    const { buffer, filename } = await this.reportsService.memberReport(userId);
    sendXlsx(res, buffer, filename);
  }

  @Get('range')
  @ApiOperation({ summary: 'Attendance in a date range — Excel (ADMIN+)' })
  @ApiQuery({ name: 'from', example: '2026-06-01' })
  @ApiQuery({ name: 'to', example: '2026-06-30' })
  async range(
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.reportsService.rangeReport(from, to);
    sendXlsx(res, buffer, filename);
  }

  @Get('service-comparison')
  @ApiOperation({ summary: 'Service comparison — JSON or Excel download (ADMIN+)' })
  @ApiQuery({ name: 'period', example: '2026-06' })
  @ApiQuery({ name: 'format', required: false, enum: ['xlsx'] })
  async serviceComparison(
    @Query('period') period = new Date().toISOString().slice(0, 7),
    @Query('format') format: string | undefined,
    @Res() res: Response,
  ) {
    if (format === 'xlsx') {
      const { buffer, filename } = await this.reportsService.serviceComparisonXlsx(period);
      sendXlsx(res, buffer, filename);
    } else {
      const data = await this.reportsService.serviceComparison(period);
      res.json({ data });
    }
  }
}
